import { Router, Request, Response, NextFunction } from 'express';
import { UserData, WhoAmI } from '../controllers/acc.controller';

const accRouter: Router = Router();

accRouter.get('/acc/whoami', async (req: Request, res: Response, next: NextFunction) => {
    const userData: UserData | undefined = await WhoAmI(req, res, next);
    
    if(userData !== undefined) {
        res.send(userData);
    } else {
        res.status(401).json({
            status: 401,
            statusText: '401 Unauthorised.',
            error: {
                code: 'UNAUTHORISED',
                message: 'Invalid ID.'
            }
        });
    }
});

export default accRouter;
