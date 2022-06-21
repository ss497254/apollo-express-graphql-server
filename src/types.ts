import { Request, Response } from "express";
import { createUserLoader } from "./utils/dataloaders/createUserLoader";
// import { createUpdootLoader } from "./utils/createUpdootLoader";

export type MyContext = {
    req: Request & { session: any };
    res: Response;
    userLoader: ReturnType<typeof createUserLoader>;
    // questionLoader: ReturnType<typeof createQuestionLoader>;
    // updootLoader: ReturnType<typeof createUpdootLoader>;
};
