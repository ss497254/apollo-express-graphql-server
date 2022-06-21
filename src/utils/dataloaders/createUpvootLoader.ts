import { QuestionUpvote, AnswerUpvote } from "../../entities";
import DataLoader from "dataloader";

export const createQuestionUpvoteLoader = () =>
    new DataLoader<
        { questionId: number; username: string },
        QuestionUpvote | null
    >(async (keys) => {
        const upvotes = await QuestionUpvote.findBy(keys as any);
        const updootIdsToQuestionUpvote: Record<string, QuestionUpvote> = {};
        upvotes.forEach((updoot) => {
            updootIdsToQuestionUpvote[
                `${updoot.username}|${updoot.questionId}`
            ] = updoot;
        });

        return keys.map(
            (key) =>
                updootIdsToQuestionUpvote[`${key.username}|${key.questionId}`]
        );
    });
