import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Info,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import PostgresDataSource from "../database/config";
import { Question, QuestionUpvote, User } from "../entities";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { makeJoins } from "../utils/makeJoins";

@InputType()
class QuestionInput {
    @Field()
    title: string;
    @Field()
    text: string;
}

@ObjectType()
class PaginatedQuestions {
    @Field(() => [Question])
    questions: Question[];
    @Field()
    hasMore: boolean;
}

@Resolver(Question)
export class QuestionResolver {
    @FieldResolver(() => Int)
    voteStatus(@Root() question: Question, @Ctx() { req }: MyContext) {
        const vote = question.questionUpvotes?.find(
            (data) => data.username === req.session.username
        );

        if (vote && vote.value) return vote.value;
        return 0;
    }

    @FieldResolver(() => User)
    creator(@Root() question: Question, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(question.creatorUsername);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async voteQuestion(
        @Arg("questionId", () => Int) questionId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const realValue = value > 0 ? 1 : -1;
        const { username } = req.session;

        const questionUpvote = await QuestionUpvote.findOne({
            where: { questionId, username },
        });

        console.log(questionUpvote);

        if (questionUpvote && questionUpvote.value !== realValue) {
            await PostgresDataSource.transaction(async (tm) => {
                await tm.query(
                    `
                    update question_upvote
                    set value = $1
                    where "questionId" = $2 and "username" = $3
                    `,
                    [realValue, questionId, username]
                );

                await tm.query(
                    `
                    update question
                    set votes = votes + $1
                    where id = $2
                    `,
                    [realValue, questionId]
                );
            });

            return true;
        } else if (!questionUpvote) {
            await PostgresDataSource.transaction(async (tm) => {
                await tm.query(
                    `
                    insert into question_upvote ("username", "questionId", value)
                    values ($1, $2, $3)
                        `,
                    [username, questionId, realValue]
                );

                await tm.query(
                    `
                        update question
                        set votes = votes + $1
                        where id = $2
                        `,
                    [realValue, questionId]
                );
            });

            return true;
        }

        return false;
    }

    @Query(() => PaginatedQuestions)
    async questions(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedQuestions> {
        const realLimit = Math.min(25, limit);
        const reaLimitPlusOne = realLimit + 1;

        const replacements: any[] = [reaLimitPlusOne];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await PostgresDataSource.query(
            `
            select q.*
            from question q
            ${cursor ? `where q."createdAt" < $2` : ""}
            order by q."createdAt" DESC
            limit $1
            `,
            replacements
        );

        return {
            questions: posts.slice(0, realLimit),
            hasMore: posts.length === reaLimitPlusOne,
        };
    }

    @Query(() => [Question]!)
    async questionsAll(
        @Ctx() { req }: MyContext,
        @Info() { fieldNodes }: any
    ): Promise<Question[]> {
        const PathArray = ["answers", "questionUpvotes", "voteStatus"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        if (
            !shouldJoin ||
            pathValues["questionUpvotes"] ||
            !pathValues["voteStatus"]
        ) {
            delete pathValues["voteStatus"];
            return Question.find({
                ...(shouldJoin ? { relations: pathValues } : {}),
            });
        }
        delete pathValues["voteStatus"];
        pathValues["questionUpvotes"] = true;

        return Question.find({
            where: {
                questionUpvotes: { username: req.session.username },
            },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Query(() => Question, { nullable: true })
    question(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext,
        @Info() { fieldNodes }: any
    ): Promise<Question | null> {
        const PathArray = ["answers", "questionUpvotes", "voteStatus"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        if (
            !shouldJoin ||
            pathValues["questionUpvotes"] ||
            !pathValues["voteStatus"]
        ) {
            delete pathValues["voteStatus"];
            return Question.findOne({
                where: { id },
                ...(shouldJoin ? { relations: pathValues } : {}),
            });
        }
        delete pathValues["voteStatus"];
        pathValues["questionUpvotes"] = true;

        return Question.findOne({
            where: {
                id,
                questionUpvotes: { username: req.session.username },
            },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Mutation(() => Question)
    @UseMiddleware(isAuth)
    async createQuestion(
        @Arg("input") input: QuestionInput,
        @Ctx() { req }: MyContext
    ): Promise<Question> {
        return Question.create({
            ...input,
            creatorUsername: req.session.username,
        }).save();
    }

    @Mutation(() => Question, { nullable: true })
    @UseMiddleware(isAuth)
    async updateQuestion(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ): Promise<Question | null> {
        const result = await PostgresDataSource.createQueryBuilder()
            .update(Question)
            .set({ title, text })
            .where('id = :id and "creatorUsername" = :creatorUsername', {
                id,
                creatorUsername: req.session.username,
            })
            .returning("*")
            .execute();
        return result.raw[0];
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteQuestion(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        let data;

        try {
            data = await Question.delete({
                id,
                creatorUsername: req.session.username,
            });
        } catch (e) {
            console.log("error while deleting \n", e);
            return false;
        }

        return data && data.affected === 1;
    }
}
