import { Router } from "express";
import { subscribeChannel } from "../controllers/subscriber.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

router.route("/subscribe").post(verifyJWT, upload.none(), subscribeChannel)

export default router
