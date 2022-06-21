import bcryptjs from "bcryptjs";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware,
    Info,
} from "type-graphql";
import { User, Question, QuestionUpvote, AnswerUpvote } from "../entities";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { createAccessToken } from "../utils/auth";
import { makeJoins } from "../utils/makeJoins";
import { removeAccessToken, sendAccessToken } from "../utils/useAccessToken";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { info } from "console";
// import { sendEmail } from "../utils/sendEmail";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@ObjectType()
class RegisterResponse {
    @Field()
    success: boolean;

    @Field()
    message: string;
}

@Resolver(User)
export class UserResolver {
    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() { req }: MyContext) {
        if (req.session?.username === user.username) {
            return user.email;
        }
        return "";
    }

    @Query(() => [QuestionUpvote])
    @UseMiddleware(isAuth)
    getAllQuestionUpvotes(
        @Ctx() { req }: MyContext,
        @Info() { fieldNodes }: any
    ) {
        const PathArray = ["question"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        return QuestionUpvote.find({
            where: { username: req.session.username },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Query(() => [AnswerUpvote])
    @UseMiddleware(isAuth)
    async getAllAnswerUpvotes(
        @Ctx() { req }: MyContext,
        @Info() { fieldNodes }: any
    ) {
        const PathArray = ["answer"];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        console.log(
            await AnswerUpvote.find({
                where: { username: req.session.username },
                ...(shouldJoin ? { relations: pathValues } : {}),
            })
        );
        return AnswerUpvote.find({
            where: { username: req.session.username },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    //   @Mutation(() => UserResponse)
    //   async changePassword(
    //     @Arg("token") token: string,
    //     @Arg("newPassword") newPassword: string,
    //     @Ctx() { redis, req }: MyContext
    //   ): Promise<UserResponse> {
    //     if (newPassword.length <= 2) {
    //       return {
    //         errors: [
    //           {
    //             field: "newPassword",
    //             message: "length must be greater than 2",
    //           },
    //         ],
    //       };
    //     }

    //     const key = FORGET_PASSWORD_PREFIX + token;
    //     const userId = await redis.get(key);
    //     if (!userId) {
    //       return {
    //         errors: [
    //           {
    //             field: "token",
    //             message: "token expired",
    //           },
    //         ],
    //       };
    //     }

    //     const userIdNum = parseInt(userId);
    //     const user = await User.findOne(userIdNum);

    //     if (!user) {
    //       return {
    //         errors: [
    //           {
    //             field: "token",
    //             message: "user no longer exists",
    //           },
    //         ],
    //       };
    //     }

    //     await User.update(
    //       { id: userIdNum },
    //       {
    //         //   password: await argon2.hash(newPassword),
    //         password: newPassword,
    //       }
    //     );

    //     await redis.del(key);

    //     // log in user after change password
    // req.session.userId = user.id;

    //     return { user };
    //   }

    //   @Mutation(() => Boolean)
    //   async forgotPassword(
    //     @Arg("email") email: string,
    //     @Ctx() { redis }: MyContext
    //   ) {
    //     const user = await User.findOne({ where: { email } });
    //     if (!user) {
    //       // the email is not in the db
    //       return true;
    //     }

    //     const token = v4();

    //     await redis.set(
    //       FORGET_PASSWORD_PREFIX + token,
    //       user.id,
    //       "ex",
    //       1000 * 60 * 60 * 24 * 3
    //     ); // 3 days

    //     await sendEmail(
    //       email,
    //       `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    //     );

    //     return true;
    //   }

    @Query(() => User)
    @UseMiddleware(isAuth)
    me(@Ctx() { req }: MyContext, @Info() { fieldNodes }: any) {
        const PathArray = [
            "answers",
            "questions",
            "questionUpvotes",
            "answerUpvotes",
        ];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        return User.findOne({
            where: { username: req.session.username },
            ...(shouldJoin ? { relations: pathValues } : {}),
        });
    }

    @Query(() => [User]!)
    async users(@Info() { fieldNodes }: any): Promise<User[]> {
        const PathArray = [
            "answers",
            "questions",
            "questionUpvotes",
            "answerUpvotes",
        ];
        const { shouldJoin, pathValues } = makeJoins(PathArray, fieldNodes);

        return User.find({ ...(shouldJoin ? { relations: pathValues } : {}) });
    }

    @Mutation(() => RegisterResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput
    ): Promise<RegisterResponse> {
        const errors = validateRegister(options);

        if (errors) {
            return { success: false, message: JSON.stringify(errors) };
        }

        const hashedPassword = await bcryptjs.hash(options.password, 4);
        // let user;

        try {
            await User.insert({
                username: options.username,
                email: options.email,
                password: hashedPassword,
                gender: options.gender,
                avatarUrl: options.avatarUrl,
            });
        } catch (err) {
            console.log(err);
            if (err.code === "23505" || err.detail.includes("already exists")) {
                return {
                    success: false,
                    message: "username or email already taken",
                };
            }

            return {
                success: false,
                message: "some error occurred",
            };
        }

        return { success: true, message: "See your inbox." };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Ctx() { req, res }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            email
                ? { where: { email: email } }
                : { where: { username: username } }
        );

        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "that username doesn't exist",
                    },
                ],
            };
        }

        const valid = await bcryptjs.compare(password, user.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password",
                    },
                ],
            };
        }

        (req as any).session = { username: user.username };
        sendAccessToken(res, createAccessToken(user));

        return { user };
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err: Error) => {
                removeAccessToken(res);
                req.session = {};
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }

                resolve(true);
            })
        );
    }
}
