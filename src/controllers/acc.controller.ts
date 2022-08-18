import { NextFunction, Request, Response } from 'express';
import { prisma } from '../server';
import { authUser } from './auth.controller';

export interface UserData {
    disc_name: string,
    disc_avatar: string
}

export async function WhoAmI(req: Request, res: Response, next: NextFunction): Promise<UserData | undefined> {
    authUser(req, res, next);

    try {
        // Can ignore this linting err -> it will never be undefined because of authUser().
        // @ts-ignore
        const user: UserData = await prisma.users.findUniqueOrThrow({
            where: {
                // @ts-ignore
                disc_id: req.session.user?.discName
            },
            select: {
                disc_id: true,
                disc_avatar: true
            }
        });

        return user;
    }catch(err){
        next(err); // TODO: internal.
    }
}