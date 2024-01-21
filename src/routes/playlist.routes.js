import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/create-playlist").post(verifyJWT, upload.none(), createPlaylist)
router.route("/add-video/:videoId/:playlistId").patch(verifyJWT, upload.none(), addVideoToPlaylist)
router.route("/get-user-playlist").get(verifyJWT, upload.none(), getUserPlaylist)
router.route("/remove-video/:videoId/:playlistId").patch(verifyJWT, upload.none(), removeVideoFromPlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT, upload.none(), deletePlaylist)
router.route("/update-playlist/:playlistId").patch(verifyJWT,upload.none(),updatePlaylist)

export default router
