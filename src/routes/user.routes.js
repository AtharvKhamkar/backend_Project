import { Router } from "express";
import {
    changeCurrentPassword,
    deleteUser,
    forgotPassword,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    resetPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount:1
        }

    ]),
    registerUser)

router.route("/login").post(upload.none(), loginUser)

//secured routes
router.route("/logout").post(upload.none(), verifyJWT, logoutUser)
router.route("/refresh-token").post(upload.none(), refreshAccessToken)
router.route("/change-password").post(upload.none(), verifyJWT, changeCurrentPassword)
router.route("/forgot-password").post(upload.none(), forgotPassword)
router.route("/reset-password/:token").patch(upload.none(),resetPassword)
router.route("/current-user").get(upload.none(), verifyJWT, getCurrentUser)
router.route("/update-account").patch(upload.none(), verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(upload.single("avatar"),verifyJWT,updateUserAvatar)
router.route("/update-coverImage").patch(upload.single("coverImage"), verifyJWT, updateUserCoverImage)
router.route("/delete-user").delete(verifyJWT,deleteUser)



export default router