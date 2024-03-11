import { redisClient } from "../db/redis.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";




const subscribeChannel = asyncHandler(async (req, res) => {
    //get channel name / user name from the req.param
    //get channel name object from database 
    //get user id from cookie through verifyJWT
    //create subscribe model by subscriber = req.user._id and channel = req.param
    //return the subscribe object

    const { channel } = req.body;
    const fetchedChannel = await User.findOne({ username:channel })
    
    
    if (!fetchedChannel) {
        throw new ApiError(400,"Channel not found")
    }

    if (!req.user._id) {
        throw new ApiError(401,"Invalid user")
    }

    const subscriptionUser = await Subscription.create({
        subscriber:req.user._id,
        channel:fetchedChannel._id
    })

    const createdUser = await Subscription.findById(subscriptionUser._id)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                createdUser,
                "User subscribed channel successfully"
            
            )
    )


    
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.body

    if (!username?.trim()) {
        throw new ApiError(400,"Username is missing")
    }

    const cachedValue = await redisClient.get(`user:${username}`)
    if (cachedValue) {
        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    JSON.parse(cachedValue),
                    "Channel profile fetched successfully"
            )
        )
    }

    const channel = await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size:"$subscribers"
                },
                channelSubscribedToCount: {
                    $size:"$subscribedTo"
                },
                isSubScribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount:1
            }
        }
    ])

    if (!channel?.length) {
        new ApiError(404,"Channel does not exists")
    }

    await redisClient.set(`user:${username}`,JSON.stringify(channel[0]),'EX',60)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user[0],
                "User watch history fetched successfully"
    ))
})



export { getUserChannelProfile, getWatchHistory, subscribeChannel };

