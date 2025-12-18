import { Router } from "express";
import {
    getMyVideos,
    uploadVideos,
    getVideoDetails,
    getUserVideos,
    getWatchHistory,
    subscribeChannel,
    unsubscribeChannel
} from "../controllers/videos.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/uploadVideo").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    uploadVideos
);
router.get("/my-videos", verifyJWT, getMyVideos);
router.route("/getVideoDetails/:id").get(verifyJWT, getVideoDetails);
router.route("/channel/:userId/videos").get(verifyJWT, getUserVideos);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);
router.route("/subscribe/:channelId").post(verifyJWT, subscribeChannel);
router.route("/unsubscribe/:channelId").post(verifyJWT, unsubscribeChannel);

export default router;
