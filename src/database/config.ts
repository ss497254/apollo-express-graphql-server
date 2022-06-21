import path from "path";
import { DataSource } from "typeorm";
import { __prod__ } from "../constants";
import {
    Answer,
    AnswerUpvote,
    Comment,
    Question,
    QuestionUpvote,
    User,
} from "../entities";

const PostgresDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "Saurabh",
    password: "localhost",
    database: "dev-1",
    logging: !__prod__,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Answer, AnswerUpvote, Question, QuestionUpvote, Comment],
});

export default PostgresDataSource;
