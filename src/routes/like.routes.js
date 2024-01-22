import { Router } from "express";
import { getLikedVideos, likeComment, likeTweet, likeVideo } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/like-video/:videoId").post(verifyJWT, upload.none(), likeVideo)
router.route("/like-comment/:commentId").post(verifyJWT, upload.none(), likeComment)
router.route("/like-tweet/:tweetId").post(verifyJWT, upload.none(), likeTweet)
router.route("/liked-videos").get(verifyJWT,getLikedVideos)

export default router;