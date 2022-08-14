import { NextFunction, Request, Response } from 'express';
import { Env } from '../utils/startup';
import { OAUTH_PROVERIDER_DISCORD, TOKEN_TTL_IN_MILLISECONDS } from '../utils/constants'
import dotenv from 'dotenv';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../server';
import { SHA256, enc } from 'crypto-js'

dotenv.config();

const env: Env = new Env();
const prisma: PrismaClient = new PrismaClient(); // TODO: Configure logging.

interface DiscordOAuthRequestData {
    url: string
    method: string
    headers: {
        'Content-Type': string 
    }
    data: string
}

interface DiscordOAuthBearerData {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    scope: string
}

interface DiscordIdentifyRequestData {
    url: string
    method: string
    headers: {
        Authorization: string
    }
}

interface DiscordIdentifyUserData {
    id: string
    username: string
    avatar: string
    avatar_decoration: string
    discriminator: string
    public_flags: number
    flags: number
    banner: string
    banner_color: string
    accent_color: string
    locale: string
    mfa_enable: boolean
    premium_type: number
}
// TODO: Logut. 
export async function DiscAuthLogic(req: Request, res: Response, next: NextFunction) {
    const discServerErr: Error = new Error('could not contact discord servers');
    discServerErr.name = 'BAD_DISC_OAUTH2_CODE_REQ';

    const discRespErr: Error = new Error('internal authentication error');
    discRespErr.name = 'BAD_AUTHENTICATION_INPUT'

    if (!req.query.code) {
        next(discServerErr);
    } else {
        if (env.IsSet()) {
            const discBearerTokenCallBody: URLSearchParams = new URLSearchParams();
            discBearerTokenCallBody.append('client_id', env.GetDiscClientId());
            discBearerTokenCallBody.append('client_secret', env.GetDiscClientSecret());
            discBearerTokenCallBody.append('grant_type', 'authorization_code');
            discBearerTokenCallBody.append('code', req.query.code.toString());
            discBearerTokenCallBody.append('redirect_uri', env.GetDisAuthRedirUrl());

            const discTokenResp: AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> | undefined = await redeemDiscordToken(discBearerTokenCallBody, next);
            if (isAxiosResponse(discTokenResp)) {
                const atMeReqOptions: AxiosRequestConfig = {
                    url: env.GetDiscIdentityUrl(),
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + discTokenResp.data.access_token,
                    },
                }

                const discAtMeResp: AxiosResponse<DiscordIdentifyUserData, DiscordIdentifyRequestData> = await axios(atMeReqOptions);
                try {
                    const userData: {
                        'user_id': number,
                        'disc_id': string,
                        'user_login_info': {
                            'session_id': string | null
                        } | null
                    } = await prisma.users.findUniqueOrThrow({
                        where: {
                            disc_id: discAtMeResp.data.username + "#" + discAtMeResp.data.discriminator
                        },
                        select: {
                            user_id: true,
                            disc_id: true,
                            user_login_info: {
                                select: {
                                    session_active: true,
                                    session_id: true
                                }
                            }
                        }
                    });

                    // Check if there is a previous session, remove if so, we don't want a user spamming inserting multiple keys.
                    if (userData.user_login_info != null && userData.user_login_info.session_id != null) {
                        try {
                            // Do not check response, if it didn't exist, we are ok.
                            await redisClient.v4.del(`gtm:${userData.user_login_info.session_id}`);

                        } catch(err) {
                            console.log('Line 115:', err);
                            next(err);

                        }
                    }

                    // TODO: Check if origin_ip is null, if null, update.
                    await prisma.user_login_info.upsert({
                        where: {
                            user_id: userData.user_id
                        },
                        create: {
                            user_id: userData.user_id,
                            init_ip: req.clientIp,
                            last_ip: req.clientIp,
                            last_interaction: new Date(new Date().getUTCDate()),
                            session_active: true,
                            session_expires: new Date(new Date().getUTCDate() + TOKEN_TTL_IN_MILLISECONDS),
                            session_id: req.sessionID,
                            oauth_provider: OAUTH_PROVERIDER_DISCORD,
                            bearer_token: discTokenResp.data.access_token,
                            refresh_token: discTokenResp.data.refresh_token
                        },
                        update: {
                            last_ip: req.clientIp,
                            last_interaction: new Date(new Date().getUTCDate()),
                            session_active: true,
                            session_expires: new Date(new Date().getUTCDate() + TOKEN_TTL_IN_MILLISECONDS),
                            session_id: req.sessionID,
                            oauth_provider: OAUTH_PROVERIDER_DISCORD,
                            bearer_token: discTokenResp.data.access_token,
                            refresh_token: discTokenResp.data.refresh_token
                        }
                    });

                    const newBearerHash: string = SHA256(discTokenResp.data.access_token).toString(enc.Base64); // TODO: Add a salt?
                    req.session.authenticated = true;
                    req.session.user = {
                        discName: userData.disc_id,
                        discAvatar: discAtMeResp.data.avatar,
                        bearerToken: newBearerHash
                    }

                    res.status(200).json({
                        status: 200,
                        statusText: '200 OK.',
                    });

                } catch(err) {
                    res.status(401).json({
                        status: 401,
                        statusText: '401 Unauthorised.'
                    });
                    
                }

            } else {
                next(discRespErr);

            }
        } else {
            next(discServerErr);

        }
    }
}

export function AppleAuthLogic(): string {
    return 'Coming soon, 🍎 bro. ✌🏼';
}

// TODO: Add session_id to these queries & check on reauth.
export async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.session.user != null) {
    // TODO: check if IP not wildly different from last_ip
        try {
            const userSession: any = await redisClient.v4.TTL(`gtm:${req.sessionID}`);
            if (userSession <= 0) {
                // Note: Once users are in a game, do not use this Auth method.
                // TODO: Handover to gameAuth, we do not want to be redirecting users mid game.
                if (req.session.user.bearerToken == null) {
                    req.session.destroy;
                    res.status(401).json({
                        status: 401,
                        statusText: '401 Unauthorised.'
                    }); // TODO: Redirect User on 401 client side.

                } else {
                    try {
                        const userTokens: {
                            'user_id': number,
                            'disc_id': string,
                            'user_login_info': {
                                'bearer_token': string | null,
                                'refresh_token': string | null
                            } | null
                        } = await prisma.users.findUniqueOrThrow({
                            where: {
                                disc_id: req.session.user.discName
                            },
                            select: {
                                user_id: true,
                                disc_id: true,
                                user_login_info: {
                                    select: {
                                        bearer_token: true,
                                        refresh_token: true
                                    }
                                }
                            }
                        });

                        if (userTokens.user_login_info?.bearer_token == null) {
                            res.status(401).json({
                                status: 401,
                                statusText: '401 Unauthorised.'
                            });
                            
                        } else {
                            const bearerHash: string | undefined = SHA256(userTokens.user_login_info.bearer_token).toString(enc.Base64) // TODO: Add a salt?

                            if (bearerHash !== req.session.user.bearerToken) {
                                // If we're here someones trying to be fruity.
                                res.status(401).json({
                                    status: 401,
                                    statusText: '401 Unauthorised.'
                                });

                            } else {
                                req.session.destroy;
                                // refresh login.
                                if (env.IsSet()) {
                                    if (userTokens.user_login_info.refresh_token !== null) {
                                        let discRefreshTokenCallBody: URLSearchParams = new URLSearchParams();
                                        discRefreshTokenCallBody.append('client_id', env.GetDiscClientId());
                                        discRefreshTokenCallBody.append('client_secret', env.GetDiscClientSecret());
                                        discRefreshTokenCallBody.append('grant-type', 'refresh_token');
                                        discRefreshTokenCallBody.append('refresh_token', userTokens.user_login_info.refresh_token);

                                        const tokenReq: AxiosRequestConfig = {
                                            url: env.GetDiscTokenUrl(),
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/x-www-form-urlencoded',
                                            },
                                            data: discRefreshTokenCallBody.toString()
                                        };

                                        const discTokenResp: AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> | undefined = await redeemDiscordToken(discRefreshTokenCallBody, next);
                                        if (isAxiosResponse(discTokenResp)) {
                                            const newBearerHash: string = SHA256(discTokenResp.data.access_token).toString(enc.Base64); // TODO: Add a salt?
                                            req.session.authenticated = true;
                                            req.session.user = {
                                                discName: userTokens.disc_id,
                                                discAvatar: 'moonShine', // TODO: Populate real data
                                                bearerToken: newBearerHash
                                            };

                                            try{
                                                await prisma.user_login_info.update({
                                                    where: {
                                                        user_id: userTokens.user_id
                                                    },
                                                    data: {
                                                        last_ip: req.clientIp,
                                                        last_interaction: new Date(new Date().getUTCDate()),
                                                        session_expires: new Date(new Date().getUTCDate() + TOKEN_TTL_IN_MILLISECONDS),
                                                        session_active: true,
                                                        session_id: req.sessionID,
                                                        oauth_provider: OAUTH_PROVERIDER_DISCORD,
                                                        bearer_token: discTokenResp.data.access_token,
                                                        refresh_token: discTokenResp.data.refresh_token
                                                    }
                                                });
                                            } catch (err) {
                                                console.log(err)
                                                // TODO: if err, retry updating DB, if x attempts fail, destroy session, return server err.
                                                // subtract x from ttl for each err.
                                            }
                                        }

                                    } else { 
                                        // TODO: Turn this into internal error - pass message to re auth with disc.
                                        res.status(401).json({
                                            status: 401,
                                            statusText: '401 Unauthorised.'
                                        });
                                    }
                                }
                            }
                        }

                        next();

                    } catch (err) {
                        next(err)

                    }
                }
            } else {
                // Next() ig?

            }

            
        } catch(err) {
            next(err)
        }

    } else {
        // Redirect
        res.status(401).json({
            status: 401,
            statusText: '401 Unauthorised.'
        });

    }
}
// TODO: Incorporate the below into authUser
// is req IP wildy different location? potential compromise? revoke session token & ask for email confirmation.

async function redeemDiscordToken(params: URLSearchParams, next: NextFunction)
    : Promise<AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> | undefined> {
        const tokenReq: AxiosRequestConfig = {
            url: env.GetDiscTokenUrl(),
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: params.toString()
        };
        
        let retryRequest: boolean = true;
        let attemptsRemaining: number = 4;

        while(retryRequest) {
            try { 
                const discTokenResp: AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> = await axios(tokenReq);
                    return discTokenResp;
                
            } catch(err) {
                attemptsRemaining--;
                if(attemptsRemaining === 0) {
                    next(err);
                    retryRequest = false;
                }
                // TODO: Find errors returned by discord and act accordingly rather than arbitrary retries.
            }
        }
}

function isAxiosResponse(response: AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> | undefined)
    : response is AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData> {
        return(response as AxiosResponse<DiscordOAuthBearerData, DiscordOAuthRequestData>).data.access_token !== undefined;
}

function isDiscordAtMeResponse(response: AxiosResponse<DiscordIdentifyUserData, DiscordIdentifyRequestData>)
    : response is AxiosResponse<DiscordIdentifyUserData, DiscordIdentifyRequestData> {
        return (response as AxiosResponse<DiscordIdentifyUserData, DiscordIdentifyRequestData>).data.username !== undefined;
}
