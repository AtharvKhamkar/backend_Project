import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
router.route("/logout").post(upload.none(),verifyJWT,logoutUser)

export default router