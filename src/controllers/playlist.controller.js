import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    
    if (!name || !description) {
        throw new ApiError(400,"Name and description required for playlist")
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner:req.user._id
    })

    const createdPlaylist = await Playlist.findById(playlist._id)
    if (!createdPlaylist) {
        throw new ApiError(401,"Error while creating playlist")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                createdPlaylist,
                "Playlist created successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    await Playlist.findByIdAndUpdate(
        new mongoose.Types.ObjectId(playlistId),
        {
            $push: {
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
                    
            },
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
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                videos:"$videos.title"
            }
        }
        
    ])
    if (!updatedPlaylist) {
        throw new ApiError(401,"Error while updating the playlist")
    }



    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added in playlist"
        )
    )

})

const getUserPlaylist = asyncHandler(async (req, res) => {
    

    const user = await Playlist.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner:1
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User playlist fetched successfully"
        )
    )
    

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        new mongoose.Types.ObjectId(playlistId),
        {
            $pull: {
                "videos": {
                    $in: [
                        videoId
                    ]
                }
            }
        },
        {
            multi: true
        },
        {
            new:true
        }
    )

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video in playlist removed successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    const toDeletePlaylist = await Playlist.findByIdAndDelete(new mongoose.Types.ObjectId(playlistId))

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "deleted_playlist": toDeletePlaylist.name,   
                },
                "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    
    if (!name && !description) {
        throw new ApiError(400,"name and description field is required to update the playlist")
    }

    const toUpdatePlaylist = await Playlist.findByIdAndUpdate(
        new mongoose.Types.ObjectId(playlistId),
        {
            $set: {
                name,
                description
            }
        },
        {
            new:true
        }
    )

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                toUpdatePlaylist,
                "Playlist updated successfully"
        )
    )
})

export { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist };

