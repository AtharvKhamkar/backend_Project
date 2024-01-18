import { Router } from "express";
import { deleteVideo, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controller.js";
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

router.route("/getVideo/:videoId").get(verifyJWT, getVideoById)
router.route("/update-video/:videoId").patch(verifyJWT, upload.fields([
    {
        name: "videoFile",
        maxCount:1
    },
    {
        name: "thumbnail",
        maxCount:1
    }
]), updateVideo)
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)

export default router