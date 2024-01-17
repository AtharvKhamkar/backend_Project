import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //only logged in user can tweet so get user id through verifyJWT
    //get content as a string from user through req.body
    //create one tweet object in database
    //retrive newly created object and return
    
    const {content} = req.body
    if (!content) {
        throw new ApiError(401,"Tweet can not be empty")
    }
    console.log(content)

    const owner = req.user
    if (!owner) {
        throw new ApiResponse(400,"Invalid user")
    }
    console.log(owner)

    const createdTweet = await Tweet.create({
        owner:req.user._id,
        content
    })

    console.log(createdTweet)

    const retrivedTweet = await Tweet.findById(createdTweet._id)
    if (!retrivedTweet) {
        throw new ApiError(401,"Error while fetching the tweets")
    }
    console.log(retrivedTweet)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                retrivedTweet,
                "Tweet created successfully"
        )
    )
})

const getUserTweet = asyncHandler(async (req, res) => {
    //get user details from token through verifyJWT
    //we have to get all the objects whose object._id is same as the object._id in req

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first:"$owner.username"
                }
            }
        }
        
    ])

    

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweets fetched successfully"
            )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const owner = req.user._id
    if (!owner) {
        throw new ApiError(400,"Invalid user or accessToken expired")
    }

    const { tweetId,updateContent } = req.params
    if (!tweetId) {
        return new ApiError(400,"Enter the new tweet")
    }

    const selectedTweet = await Tweet.findByIdAndUpdate(
        new mongoose.Types.ObjectId(tweetID),
        {
            $set : {
                content:updateContent.trim()
            }
        
        },
        {
            new:true
        }
    )

    const updatedTweet = await Tweet.findById(selectedTweet._id)

    if (!updatedTweet) {
        throw new ApiError(401,"Error while updating tweet")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //get tweetId from user through parameter
    //convert tweetId into mongoDB _id
    //use findonedelete()
    //send response
    const { tweetId } = req.params
    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet deleted successfully"
        )
    )
    

})

export { createTweet, deleteTweet, getUserTweet, updateTweet };

