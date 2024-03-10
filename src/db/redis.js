require('dotenv').config();
import { Redis } from "ioredis";

export const redisClient = new Redis({
    host: process.env.REDIS_SERVICE_NAME,
    port:process.env.REDIS_PORT || 6381
})