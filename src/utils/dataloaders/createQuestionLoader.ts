import { Question } from "../../entities/Questions";
import DataLoader from "dataloader";

export const createQuestionLoader = () =>
    new DataLoader<number, Question | null>(async (keys) => {
        console.log(keys);

        const questions = await Question.find();

        const QuestionIdsToQuestion: Record<number, Question> = {};

        questions.forEach((question) => {
            QuestionIdsToQuestion[question.id] = question;
        });

        return keys.map((key) => QuestionIdsToQuestion[key]);
    });
