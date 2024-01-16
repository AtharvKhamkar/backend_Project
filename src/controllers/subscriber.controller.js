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

export { subscribeChannel };
