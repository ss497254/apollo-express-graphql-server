import PostgresDataSource from "./database/config";
import { User, Question } from "./entities";

export default async function temp() {
    const userRepository = PostgresDataSource.getRepository(User);
    const users = await userRepository.find({
        where: {
            questions: { id: 1 },
        },
        relations: {
            questions: true,
        },
    });
    return users.map((user) => ({
        ...user,
        ...user.questions,
    }));
}
