import { Router, Request, Response, NextFunction, response } from 'express';
import { AppleAuthLogic, DiscAuthLogic } from '../controllers/auth.controller';

const authRouter: Router = Router();

authRouter.get('/auth/discord', async (req: Request, res: Response, next: NextFunction) => {
    await DiscAuthLogic(req, res, next);
});

authRouter.get('/auth/apple', (_req: Request, res: Response) => {
    res.send(AppleAuthLogic());
});

export default authRouter;
