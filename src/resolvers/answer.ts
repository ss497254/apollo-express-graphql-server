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
import { Answer, User, AnswerUpvote } from "../entities";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { makeJoins } from "../utils/makeJoins";

@InputType()
class AnswerInput {
    @Field()
    questionId: number;
    @Field()
    title: string;
    @Field({ nullable: true })
    main: string;
    @Field()
    content: string;
    @Field({ nullable: true })
    footer: string;
}

@ObjectType()
class PaginatedAnswers {
    @Field(() => [Answer])
    answers: Answer[];
    @Field()
    hasMore: boolean;
}

@Resolver(Answer)
export class AnswerResolver {
    @FieldResolver(() => User)
    creator(@Root() answer: Answer, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(answer.creatorUsername);
    }

    @FieldResolver(() => Int)
    voteStatus(@Root() answer: Answer, @Ctx() { req }: MyContext) {
        const vote = answer.answerUpvotes?.find(
            (data) => data.username === req.session.username
        );

        if (vote && vote.value) return vote.value;
        return 0;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async voteAnswer(
        @Arg("answerId", () => Int) answerId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        if (value === 0) return false;
        const realValue = value > 0 ? 1 : -1;
        const { username } = req.session;

        const answerUpvote = await AnswerUpvote.findOne({
            where: { answerId, username },
        });

        console.log(answerUpvote);

        if (answerUpvote && answerUpvote.value !== realValue) {
            await PostgresDataSource.transaction(async (tm) => {
                await tm.query(
                    `
                    update answer_upvote
                    set value = $1
                    where "answerId" = $2 and "username" = $3
                    `,
                    [realValue, answerId, username]
                );

                await tm.query(
                    `
                    update answer
                    set votes = votes + $1
                    where id = $2
                    `,
                    [realValue, answerId]
                );
            });

            return true;
        } else if (!answerUpvote) {
            await PostgresDataSource.transaction(async (tm) => {
                await tm.query(
                    `
                    insert into answer_upvote ("username", "answerId", value)
                    values ($1, $2, $3)
                    `,
                    [username, answerId, realValue]
                );

                await tm.query(
                    `
                    update answer
                    set votes = votes + $1
                    where id = $2
                    `,
                    [realValue, answerId]
                );
            });

            return true;
        }

        return false;
    }

    @Query(() => PaginatedAnswers)
    async answers(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedAnswers> {
        const realLimit = Math.min(5, limit);
        const reaLimitPlusOne = realLimit + 1;

        const replacements: any[] = [reaLimitPlusOne];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await PostgresDataSource.query(
            `
            select q.*
            from answer q
            ${cursor ? `where q."createdAt" < $2` : ""}
            order by q."createdAt" DESC
            limit $1
            `,
            replacements
        );

        return {
            answers: posts.slice(0, realLimit),
            hasMore: posts.length === reaLimitPlusOne,
        };
    }

    @Query(() => [Answer]!)
    async answersAll(
        @Ctx() { req }: MyContext,
        @Info() { fieldNodes }: any
    ): Promise<Answer[]> {
        const PathArray = ["question", "answerUpvotes", "voteStatus"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        if (
            !shouldJoin ||
            pathValues["answerUpvotes"] ||
            !pathValues["voteStatus"]
        ) {
            delete pathValues["voteStatus"];
            return Answer.find({
                ...(shouldJoin ? { relations: pathValues } : {}),
            });
        }
        delete pathValues["voteStatus"];
        pathValues["answerUpvotes"] = true;

        return Answer.find({
            where: {
                answerUpvotes: { username: req.session.username },
            },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Query(() => Answer, { nullable: true })
    answer(
        @Ctx() { req }: MyContext,
        @Arg("id", () => Int) id: number,
        @Info() { fieldNodes }: any
    ): Promise<Answer | null> {
        const PathArray = ["question", "answerUpvotes", "voteStatus"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        if (
            !shouldJoin ||
            pathValues["answerUpvotes"] ||
            !pathValues["voteStatus"]
        ) {
            delete pathValues["voteStatus"];
            return Answer.findOne({
                where: { id },
                ...(shouldJoin ? { relations: pathValues } : {}),
            });
        }
        delete pathValues["voteStatus"];
        pathValues["answerUpvotes"] = true;

        return Answer.findOne({
            where: {
                id,
                answerUpvotes: { username: req.session.username },
            },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Mutation(() => Answer)
    @UseMiddleware(isAuth)
    async createAnswer(
        @Arg("input") input: AnswerInput,
        @Ctx() { req }: MyContext
    ): Promise<Answer> {
        const data = await Answer.create({
            ...input,
            creatorUsername: req.session.username,
        }).save();
        await PostgresDataSource.transaction(async (tm) => {
            await tm.query(
                `
                update question
                set "answerCount" = "answerCount" + 1
                where id = $1
                `,
                [input.questionId]
            );
        });
        console.log(data);

        return data;
    }

    @Mutation(() => Answer, { nullable: true })
    @UseMiddleware(isAuth)
    async updateAnswer(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("main") main: string,
        @Arg("content") content: string,
        @Arg("footer") footer: string,
        @Ctx() { req }: MyContext
    ): Promise<Answer | null> {
        const result = await PostgresDataSource.createQueryBuilder()
            .update(Answer)
            .set({ title, main, content, footer })
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
    async deleteAnswer(
        @Arg("id", () => Int) id: number,
        @Arg("questionId", () => Int) questionId: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        let data;

        try {
            data = await Answer.delete({
                id,
                creatorUsername: req.session.username,
            });
        } catch (e) {
            console.log(e);
            return false;
        }

        if (data && data.affected === 1) {
            await PostgresDataSource.transaction(async (tm) => {
                await tm.query(
                    `
                    update question
                    set "answerCount" = "answerCount" - 1
                    where id = $1
                    `,
                    [questionId]
                );
            });
            return true;
        }
        return false;
    }
}
