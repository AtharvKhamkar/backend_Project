import { Router } from "express";
import { createTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


router.route("/create-tweet").post(verifyJWT, upload.none(), createTweet)
router.route("/all-tweets").get(verifyJWT, getUserTweet)
router.route("/update-tweet").patch(verifyJWT,upload.none(),updateTweet)
router.route("/delete-tweet/:tweetId").delete(verifyJWT,deleteTweet)
router.route("/update-tweet/:tweetId/:updateContent").patch(verifyJWT,updateTweet)
export default router