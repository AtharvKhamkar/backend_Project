import dotenv from "dotenv";
import { Redis } from "ioredis";
dotenv.config({
    path: './env'
})

export const redisClient = new Redis({
    host: process.env.REDIS_SERVICE_NAME,
    port:process.env.REDIS_PORT || 6381
})