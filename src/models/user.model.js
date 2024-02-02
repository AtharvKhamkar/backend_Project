import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index:true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim:true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index:true,
        },
        avatar: {
            type: String,
            required:true,
        },
        coverImage: {
            type:String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password: {
            type: String,
            required:[true,"Password is required"]
        },
        refreshToken: {
            type:String
        },
        passwordChangedTime: {
            type:Date
        },
        passwordResetToken: {
            type:String
        },
        passwordResetTokenExpiry: {
            type:Date
        }

    },
    {
        timestamps:true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () { 
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generatePasswordResetToken = async function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
    this.passwordResetTokenExpiry = Date.now() + 30 * 60 * 1000;
    return token

}


export const User = mongoose.model("User", userSchema)

