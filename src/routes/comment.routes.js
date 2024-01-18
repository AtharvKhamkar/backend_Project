import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

router.route("/add-comment/:videoId").post(verifyJWT, upload.none(), addComment)
router.route("/video-comments/:videoId").get(verifyJWT, getVideoComments)
router.route("/update-comment/:commentId").patch(verifyJWT, upload.none(), updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT,deleteComment)

export default router;