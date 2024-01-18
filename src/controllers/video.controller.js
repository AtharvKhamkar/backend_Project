import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";

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
    const video = await Video.findById(new mongoose.Types.ObjectId(videoId))

    if (!video) {
        throw new ApiError(400,"Invalid video Id")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
        )
    )

    
    
})



export { getVideoById, publishAVideo };

