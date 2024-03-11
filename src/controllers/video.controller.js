import mongoose, { isValidObjectId } from "mongoose";
import { redisClient } from "../db/redis.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 2,query } = req.query;
    const pipeline = [];

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400,"Invalid user")
    }

    const cachedValue = await redisClient.get(`video:${req.query.page}:${req.query.limit}:${req.query.query}`)
    if (cachedValue) {
        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    JSON.parse(cachedValue),
                    "Videos fetched successfully"
            )
        )
    }

    pipeline.push({
        $match: {
            owner:new mongoose.Types.ObjectId(req.user?._id)
        }
    })

    if (query) {
        pipeline.push(
        {
            $search: {
                index: "search-video",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

    pipeline.push(
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                isPublished: 1,
                owner:1
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
        
    )


    

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options)
    await redisClient.set(`video:${req.query.page}:${req.query.limit}:${req.query.query}`,JSON.stringify(video),'EX',60)
    
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Videos fetched successfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    //get title and description from user through req.body
    //get local video path and thumbnail from user through req.file
    //upload file on cloudinary and get url from cloudinary
    //if it uploaded successfully set isPublished as true
    const { title, description } = req.body
    
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if (!videoFileLocalPath) {
        throw new ApiError(400,"Video file is required")
    }

    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailFileLocalPath) {
        throw new ApiError(401,"Thumbnail is required for video")
    }

    const videoFile = await uploadOnClodinary(videoFileLocalPath)
    const thumbnail = await uploadOnClodinary(thumbnailFileLocalPath)

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        title,
        description,
        duration: Math.ceil(videoFile.duration),
        views: 100,
        isPublished:true
    })

    const uploadedVideo = await Video.findById(video._id)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                uploadedVideo,
                "Video uploaded successfully"
        )
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    //send video id through req.params
    //convert id in params into the mongoDb id

    const { videoId } = req.params
    const cachedValue = await redisClient.get(`video:${videoId}`)
    if (cachedValue) {
        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    JSON.parse(cachedValue),
                    "Video fetched successfully"
            )
        )
    }
    const video = await Video.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(videoId)
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

    if (!video) {
        throw new ApiError(400,"Invalid video Id")
    }

    await redisClient.set(`video:${videoId}`,JSON.stringify(video),'EX',60)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
        )
    )

    
    
})

const updateVideo = asyncHandler(async (req, res) => {
    //get videoId through req.params
    //get localfile path and upload on coudinary
    //after getting url from cloudinary
    //update the videoFile field
    //return the newly updated object as response
    const { videoId } = req.params
    const {title,description} = req.body
    
    const videoLocalPath = req.files?.videoFile[0]?.path
    console.log(videoLocalPath)
    if (!videoLocalPath) {
        throw new ApiError(400,"Video local path does not found")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiResponse(200,"Thumbnail local path does not found")
    }

    const videoFile = await uploadOnClodinary(videoLocalPath)
    const thumbnail = await uploadOnClodinary(thumbnailLocalPath)
    

    await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        {
            $set: {
                videoFile: videoFile.url,
                thumbnail:thumbnail.url,
                title,
                description,
                duration:Math.ceil(videoFile.duration),
            },   
        },
        {
            new : true
        }
    )
    const video = await Video.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(videoId)
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
                video,
                "Video updated successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    //get videoId through req.params
    //find the videoId in database and delete the video
    const { videoId } = req.params
    
    const todeleteVideo = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId))

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    deleted_Video_name: todeleteVideo.title
                },
                "Video File deleted successfully"
        )
    )
})

const videoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const checkVideo = await Video.findById(videoId)
    if (!checkVideo) {
        throw new ApiError(400, "Invalid video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        {
            $inc: {
                views:1
            }
        },
        {
            new:true
        }
    )

    const updateWatchHistory = await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(req.user._id),
        {
            $push: {
                watchHistory:videoId
            }
        },
        {
            new:true
        }
    
    
    )

    res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "View Count updated"
        )
    )
    

})


export { deleteVideo, getAllVideos, getVideoById, publishAVideo, updateVideo, videoViews };

