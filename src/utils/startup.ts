import { RedisClientOptions } from 'redis';

export class Env {

    #port: string
    #discClientId: string | undefined
    #discSecret: string | undefined
    #discAuthRedirUrl: string | undefined
    #discTokenUrl: string | undefined
    #discApiIdentityUrl: string | undefined
    #redisPort: number
    #redisHost: string
    #redisUrl: string | undefined
    #redisUser: string | undefined
    #redisPassword: string | undefined

    constructor() {
        const dateTime: string = new Date().toUTCString();

        if (!process.env.PORT) {
            this.#port = '3002';
            console.log(`${dateTime} PORT UNDEFINED: Setting sensible default - 3002.`);
        } else {
            this.#port = process.env.PORT;
        }

        if (!process.env.DISCORD_CLIENT_ID) {
            this.#discClientId = undefined;
            console.log(`${dateTime} DISCORD_CLIENT_ID UNDEFINED: Discord oauth2 will be unavailable.`);
        } else {
            this.#discClientId = process.env.DISCORD_CLIENT_ID;
        }

        if (!process.env.DISCORD_CLIENT_SECRET) {
            this.#discSecret = undefined;
            console.log(`${dateTime} DISCORD_CLIENT_SECRET UNDEFINED: Discord oauth2 will be unavailable.`);
        } else {
            this.#discSecret = process.env.DISCORD_CLIENT_SECRET;
        }

        if (!process.env.DISCORD_AUTH_REDIRECT_URL) {
            this.#discAuthRedirUrl = undefined;
            console.log(`${dateTime} DISCORD_AUTH_REDIRECT_URL UNDEFINED: Discord oauth2 will be unavailable.`);
        } else {
            this.#discAuthRedirUrl = process.env.DISCORD_AUTH_REDIRECT_URL;
        }

        if (!process.env.DISCORD_API_TOKEN_URL) {
            this.#discTokenUrl = undefined;
            console.log(`${dateTime} DISCORD_API_TOKEN_URL UNDEFINED: Discord oauth2 will be unavailable.`);
        } else {
            this.#discTokenUrl = process.env.DISCORD_API_TOKEN_URL;
        }

        if (!process.env.DISCORD_API_IDENTITY_URL) {
            this.#discApiIdentityUrl = undefined;
            console.log(`${dateTime} DISCORD_API_IDENTITY_URL UNDEFINED: Discord oauth2 will be unavailable.`);
        } else {
            this.#discApiIdentityUrl = process.env.DISCORD_API_IDENTITY_URL;
        }

        if (!process.env.REDIS_PORT) {
            console.log(`${dateTime} REDIS_PORT UNDEFINED: Exiting... Can not continue...`);
            process.exit();
        } else {
            this.#redisPort = parseInt(process.env.REDIS_PORT);
        }

        if (!process.env.REDIS_HOST) {
            console.log(`${dateTime} REDIS_HOST UNDEFINED: Exiting... Can not continue...`);
            process.exit();
        } else {
            this.#redisHost = process.env.REDIS_HOST;
        }

        if (process.env.REDIS_URL) {
            this.#redisUrl = process.env.REDIS_URL;
        }

        if (process.env.REDIS_USER) {
            this.#redisUser = process.env.REDIS_USER;
        }

        if (process.env.REDIS_PASSWORD) {
            this.#redisPassword = process.env.REDIS_PASSWORD;
        }
    }

    GetPort(): string {
        return this.#port;
    }

    GetDiscClientId(): string {
        if (this.#discClientId) {
            return this.#discClientId;
        } else {
            return '';
        }
    }

    GetDiscClientSecret(): string  {
        if (this.#discSecret) {
            return this.#discSecret;
        } else {
            return '';
        }
    }

    GetDisAuthRedirUrl(): string {
        if (this.#discAuthRedirUrl) {
            return this.#discAuthRedirUrl;
        } else {
            return '';
        }
    }

    GetDiscTokenUrl(): string {
        if (this.#discTokenUrl) {
            return this.#discTokenUrl;
        } else {
            return '';
        }
    }

    GetDiscIdentityUrl(): string {
        if (this.#discApiIdentityUrl) {
            return this.#discApiIdentityUrl;
        } else {
            return '';
        }
    }

    IsSet(): boolean {
        if (
            this.#discClientId &&
            this.#discSecret &&
            this.#discAuthRedirUrl &&
            this.#discTokenUrl &&
            this.#discApiIdentityUrl
        ) {
            return true;
        }
        return false;
    }

    GetRedisClientOptions(): any {
        if (this.#redisUrl === undefined) {
            return <RedisClientOptions>{
                socket: {
                    host: this.#redisHost,
                    port: this.#redisPort,
                },
                legacyMode: true
            }
        } else {
            return <RedisClientOptions>{
                socket: {
                    host: this.#redisHost,
                    port: this.#redisPort,
                    username: this.#redisUser,
                    password: this.#redisPassword
                },
                url: this.#redisUrl,
                legacyMode: true
            }
        }
    }
}
