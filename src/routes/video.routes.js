import { Router } from "express";
import { getVideoById, publishAVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

router.route("/publish-video").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount:1
        }
    ]),publishAVideo
)

router.route("/getVideo/:videoId").get(verifyJWT,getVideoById)

export default router