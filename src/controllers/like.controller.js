import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const likeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const checkLike = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        video:new mongoose.Types.ObjectId(videoId)
                    },
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user._id)
                    }
                ]
            }
        }
    ])

    if (checkLike.length>0) {
        await Like.findByIdAndDelete(checkLike[0]._id)
        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Video disliked"
            )
        )
    } else {
        const likes = await Like.create({
            video:new mongoose.Types.ObjectId(videoId),
            likedBy: req.user._id,
        })

        return res.status(200)
        .json(
            new ApiResponse(
                200,
                likes,
                "Video liked successfully"
        )
    )
    }    
})

const likeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"Please send valid commentId")
    }

    const checkLikedComment = await Like.findOne({
        comment: commentId,
        likedBy:req.user?._id
    })

    if (checkLikedComment) {
        await Like.findByIdAndDelete(checkLikedComment._id)

        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Comment disliked"
            )
        )
    } else {
        const addedLike = await Like.create({
            comment: commentId,
            likedBy:req.user?._id
        })

        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    addedLike,
                    "Comment liked successfully"
            )
        )
    }


})

const likeTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Please send valid tweetId")
    }

    const isLikedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy:req.user?._id
    })

    if (isLikedTweet) {
        await Like.findByIdAndDelete(isLikedTweet._id)

        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Tweet disliked"
            )
        )
    } else {
        const addedLike = await Like.create({
            tweet: tweetId,
            likedBy:req.user?._id
        })

        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    addedLike,
                    "Tweet liked successfully"
            )
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const allLikedVideo = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        video: { $exists: true }
                    }
                ]
            }
        },
        {
            $project: {
                video: 1,
                likedBy:1
            }

        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "likedBy",
                pipeline: [
                    {
                        $project: {
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedBy: {
                    $first:"$likedBy.username"
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first:"$video.title"
                },
                
            }
        }

    ])

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                allLikedVideo,
                "Success"
        )
    )
})

const getLikedComments = asyncHandler(async (req, res) => {
    const allLikedComments = await Like.aggregate([
        {
            $match: {
                $and:[
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        comment: {
                            $exists:true
                        }
                    }
                    
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "likedBy",
                pipeline: [
                    {
                        $project: {
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedBy: {
                    $first:"$likedBy.username"
                }
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "comment",
                pipeline: [
                    {
                        $project: {
                            content:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                comment: {
                    $first:"$comment.content"
                }
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                allLikedComments,
                "all user liked comments fetched successfully"
        )
    )
})

const getLikedTweets = asyncHandler(async (req, res) => {
    const allLikedTweets = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        likedBy:new mongoose.Types.ObjectId(req.user?._id)
                    },
                    {
                        tweet: {
                            $exists:true
                        }
                    }
                ]
            }
        },
        {
            $project: {
                likedBy: 1,
                tweet:1
            }

        },

        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet",
                pipeline: [
                    {
                        $project: {
                            content:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                tweet: {
                    $first:"$tweet.content"
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "likedBy",
                pipeline: [
                    {
                        $project: {
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedBy: {
                    $first:"$likedBy.username"
                }
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                allLikedTweets,
                "All liked tweets fetched successfully"
        )
    )
})



export { getLikedComments, getLikedTweets, getLikedVideos, likeComment, likeTweet, likeVideo };

