import { Router } from "express";
import {
    getUserChannelProfile,
    getWatchHistory,
    subscribeChannel
} from "../controllers/subscriber.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

router.route("/subscribe").post(verifyJWT, upload.none(), subscribeChannel)
router.route("/user-Chanel-details").get(verifyJWT, upload.none(), getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router
