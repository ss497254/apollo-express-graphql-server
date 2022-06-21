import { User } from "../entities/Users";
import { sign } from "jsonwebtoken";
import { COOKIE_SECRET, COOKIE_EXPIRES_IN } from "../constants";

export const createAccessToken = (user: User) => {
    return sign(
        {
            username: user.username,
            tokenVersion: user.tokenVersion,
            staff: user.staff,
        },
        COOKIE_SECRET,
        {
            expiresIn: COOKIE_EXPIRES_IN,
            algorithm: "HS256",
        }
    );
};
