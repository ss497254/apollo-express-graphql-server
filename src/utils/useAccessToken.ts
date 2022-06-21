import { Response } from "express";
import { COOKIE_NAME } from "../constants";

export const sendAccessToken = (
    res: Response,
    token: string,
    options = { cookieName: COOKIE_NAME, path: "/" }
) => {
    res.cookie(options.cookieName, token, {
        httpOnly: true,
        path: options.path,
    });
};

export const removeAccessToken = (res: Response, cookieName?: string) => {
    res.clearCookie(cookieName || COOKIE_NAME);
};
