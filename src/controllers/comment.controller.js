import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
    //get content from user through req.body
    //get videoId through req.params
    //get owner through verifyJWT req.user._id

    const { content } = req.body
    const { videoId } = req.params

    if (!content) {
        throw new ApiError(400,"Comment is required")
    }
    
    const addedComment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner:req.user._id
    })

    const comment = await Comment.findById(addedComment._id)

    if (!comment) {
        throw new ApiError(401,"Error while adding the comment")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Comment added successfully"
        )
    )

})

const getVideoComments = asyncHandler(async (req, res) => {
    //send videoId through req.params
    //find comments of same videoId
    //return the result of aggregate pipeline

    const { videoId } = req.params
    
    const comments = await Comment.aggregate([
        {
            $match: {
               video:new mongoose.Types.ObjectId(videoId) 
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
                            title:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first:"$video.title"
                }
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
                comments,
                "Comments of a specific video fetched successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    //get commentId through req.params
    //retrive comment and $set content field

    const { commentId } = req.params
    const { content } = req.body
    
    if (!content) {
        throw new ApiError(400,"new comment is required for update")
    }

    const comment = await Comment.findByIdAndUpdate(
        new mongoose.Types.ObjectId(commentId),
        {
            $set: {
                content
            }
        },
        {
            new:true
        }
    )

    const updatedComment = await Comment.findById(comment._id)

    if (!updatedComment) {
        throw new ApiError(401,"Error while updating the comment")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    //get commentId from the user req.params
    //findby and delete comment

    const { commentId } = req.params
    
    const toDeleteComment = await Comment.findByIdAndUpdate(
        new mongoose.Types.ObjectId(commentId)
    )

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    deleted_comment:toDeleteComment.content
                },
                "Comment deleted successfully"

        )
    )
})



export { addComment, getVideoComments, updateComment,deleteComment };

