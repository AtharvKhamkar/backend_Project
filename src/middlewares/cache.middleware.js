import { redisClient } from "../db/redis.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const checkCache = asyncHandler(async (req, res, next) => {
    try {
        const cacheKey = `${req.user?._id} : ${req?.params.Id} : ${req?.query?.page } : ${req?.query?.limit}`

        const data = await redisClient.get(cacheKey);
        if (data) {
            return res.status(200)
                .json(
                    new ApiResponse(
                        200,
                        JSON.parse(data),
                        "Successfully fetched data"
                )
            )
        } else {
            req.cacheKey = cacheKey;
            next();
        }
    } catch (error) {
        throw new ApiError(400,`${error} while fetching the cache value`)
    }
})