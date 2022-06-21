import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import cookieParser from "cookie-parser";
import express from "express";
import { verify } from "jsonwebtoken";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, COOKIE_SECRET, PORT } from "./constants";
import PostgresDataSource from "./database/config";
import { AnswerResolver } from "./resolvers/answer";
// import { User } from "./entities";
import { QuestionResolver } from "./resolvers/question";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import temp from "./temp";
// import path from "path";
import { createUserLoader } from "./utils/dataloaders/createUserLoader";

const main = async () => {
    const app = express();

    await PostgresDataSource.initialize();
    await PostgresDataSource.runMigrations();

    app.use(cookieParser());
    app.use(cors({ credentials: true }));

    app.get("/sync", async (_, res) => {
        await PostgresDataSource.dropDatabase();
        await PostgresDataSource.synchronize();
        res.send("done!");
    });

    app.use(async (req, _, next) => {
        const token = req.cookies[COOKIE_NAME];

        if (!token) {
            return next();
        }

        let payload: any = null;
        try {
            payload = verify(token, COOKIE_SECRET, {
                algorithms: ["HS256"],
            });
        } catch (err) {
            console.log(err);
            return next();
        }

        (req as any).session = {
            username: payload.username,
            destroy: (cb: (err: any) => void) => {
                cb(null);
            },
        };
        await next();
    });

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, QuestionResolver, AnswerResolver],
            validate: true,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            userLoader: createUserLoader(),
        }),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    app.listen(parseInt(PORT), () => {
        console.log(
            "\x1b[32m\x1b[1m\nSERVER STARTED!\n     ProcessID:",
            process.pid,
            "\x1b[0m",
            "\x1b[1m",
            `\n     URL: http://localhost:${PORT} \n`,
            "\x1b[0m"
        );
    });

    app.get("/temp", async (_, res) => {
        res.send(await temp());
    });
};

main().catch((err) => {
    console.error("main error ->> ", err);
});
