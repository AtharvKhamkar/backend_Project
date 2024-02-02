import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, updateVideo, videoViews } from "../controllers/video.controller.js";
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
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo)
router.route("/all-videos").get(verifyJWT, getAllVideos)
router.route("/update-view/:videoId").patch(verifyJWT,videoViews)

export default router