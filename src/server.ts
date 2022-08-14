import express, { Express, Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import session from 'express-session';
import { Env } from './utils/startup';
import { TOKEN_TTL_IN_SECONDS } from './utils/constants';
import cors from 'cors';
import helmet from 'helmet';
import rootRouter from './routes/root';
import authRouter from './routes/auth';
import dotenv from 'dotenv';
import requestip from 'request-ip';
import compression from 'compression';

dotenv.config();

const env: Env = new Env();
const app: Express = express();

declare module 'express-session' {
    export interface SessionData {
        authenticated: boolean,
        user: {
            discName: string,
            discAvatar: string,
            bearerToken: string
        }
    }
};

let redisStore = require('connect-redis')(session);
// TODO: Set production env variables in client and connect remotely.
export const redisClient: RedisClientType = createClient(env.GetRedisClientOptions());

(
    async () => {
        await redisClient.connect();
        console.log(`Connected to redis on: ${env.GetRedisClientOptions().socket.url}`)
    }
)();


app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(session({
        secret: 'abcd', // TODO: Session Secret Rotation
        store: new redisStore({
            client: redisClient,
            prefix: 'gtm:',
            ttl: TOKEN_TTL_IN_SECONDS
        }),
        saveUninitialized: false,
        resave: false
    })
);
app.use(requestip.mw());
app.use(compression());

app.disable('x-powered-by');

app.use('/api/v0/', rootRouter);
app.use('/api/v0/', authRouter);

app.use((err: any, _req: Request, _res: Response, next: NextFunction) => {
    console.log('%s %s: %s ', new Date().toUTCString(), err.name, err.message);
    next(err);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
        status: 500,
        statusText: 'INTERNAL SERVER ERROR',
        error: {
            code: err.name,
            message: err.message
        }
    });
});
// Start server
app.listen(env.GetPort(), () => console.log(`Server is listening on port ${env.GetPort()}!`));
