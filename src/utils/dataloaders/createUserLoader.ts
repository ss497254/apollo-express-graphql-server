import DataLoader from "dataloader";
import { User } from "../../entities/Users";

export const createUserLoader = () =>
    new DataLoader<string, User>(async (usernames) => {
        const users = await User.find({
            where: usernames.map((username) => ({ username })),
        });

        const usernameToUser: Record<string, User> = {};
        users.forEach((u) => {
            usernameToUser[u.username] = u;
        });

        const sortedUsers = usernames.map(
            (username) => usernameToUser[username]
        );

        return sortedUsers;
    });
