import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { sendEmail } from "./email.controller.js";


const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }

}


//register user in the database
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    console.log(req.body)

    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() == "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
        
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    let [avatar,coverImage]=await Promise.all([uploadOnClodinary(avatarLocalPath),uploadOnClodinary(coverImageLocalPath)]);


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        watchHistory:[]
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});


//login user
const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


//Logout User 
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User logged Out"))
    
})

//renew refresh and access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    console.log(incomingRefreshToken)

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Invalid refresh token")
    }

    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodedRefreshToken?._id)
    console.log(user._id)

    if (!user) {
        throw ApiError(401,"Invalid User")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(402,"refresh token did not matched")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    console.log(refreshToken)
    
    const options = {
        httpOnly: true,
        secure:true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken
                },
                "New refreshToken generated successfully"
        )
    )
})


//change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (oldPassword === newPassword) {
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    {},
                    "New password can not be same as old password"
            )
        )
    }
    
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400,"Invalid User")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed Successfully"
        )
    )
})

const forgotPassword = asyncHandler(async (req, res) => {
    //get gmail from the user
    //check the user gmail is in database and get user instance
    //add resetPasswordToken in that instance
    //pass token through link
    //create data object and pass to the emailSender
    //return token
    const { email } = req.body
    const fetchedUser = await User.findOne({ email })
    if (!fetchedUser) {
        throw new ApiError(400,"Invalid user")
    }

    

    const token = await fetchedUser.generatePasswordResetToken();
    await fetchedUser.save();
    const info = `Hey please follow the given URL to reset your password.This link is only valid for next 10 min from now.<a href='http://localhost:8000/api/v1/users/reset-password/${token}'>Click here</>`;
    const data = {
        to: email,
        subject: "Password reset",
        text: "Hey user",
        html:info
    }
    sendEmail(data)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                token,
                "Password reset email send successfully"
        )
    )
})

const resetPassword = asyncHandler(async (req, res) => {
    //get newPassword throgh req.body and token through req.params
    //hash token
    //retrive user from database using hashed token and resetTokenExpiry
    //if user found change password and make resetToken and expiry undefined

    const { newPassword } = req.body
    const { token } = req.params
    
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const fetchedUser = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry:{$gt:Date.now()}
    })

    console.log(fetchedUser)

    if (!fetchedUser) {
        throw new ApiError(400,"Token expired,please try again later")
    }
    fetchedUser.password = newPassword
    fetchedUser.passwordResetToken = undefined
    fetchedUser.passwordResetTokenExpiry = undefined
    await fetchedUser.save()

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully"
        )
    )
})


//get current user details
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req?.user,
                "Successfully found logged in user"
        )
    )
})


//change fullName and email
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    
    if (!fullName || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Account details modified successfully"
        )
    )
})


//update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Local image path does not found")
    }

    const avatar = await uploadOnClodinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(401, "Error while uploading the image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user.avatar,
                "User Avatar changed successfully"
        )
    )
})


//update user coverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"Local image path does not found")
    }

    const coverImage = await uploadOnClodinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(401,"Error while uploading file on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user.coverImage,
                "User cover image updated Successfully"
        )
    )
})


//delete user from database
const deleteUser = asyncHandler(async (req, res) => {
    //get user object from verifyJWT

    const user = await User.findByIdAndDelete(req.user?._id)
    console.log(user)

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "deleted_user":user._id
                },
                "User deleted from database"
        )
    )
})

export { changeCurrentPassword, deleteUser, forgotPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage };

