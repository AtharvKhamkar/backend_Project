import dotenv from "dotenv";
import { Redis } from "ioredis";
dotenv.config({
    path: './env'
})

export const redisClient = new Redis(process.env.REDIS_URL)