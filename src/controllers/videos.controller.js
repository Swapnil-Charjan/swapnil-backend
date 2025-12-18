import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

//Upload Video
const uploadVideos = asyncHandler(async (req, res) => {
    console.log("BODY =>", req.files);
    const { title, description, duration } = req.body;

    for (const [key, value] of Object.entries(req.body)) {
        if (!value) {
            return res.status(400).json({
                message: `${key} field is required!`
            });
        }
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    //Check videoFile required
    if (!videoFilePath) {
        throw new ApiError(400, "Video is file requied");
    }

    //Check thumbnail required
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is file requied");
    }

    const video = await Video.create({
        videoFile: videoFilePath,
        thumbnail: thumbnailPath,
        title,
        description,
        duration,
        owner: req.user?._id, // if using auth middleware
    });

    return res
        .status(201)
        .json(new ApiResponse(200, video, "Video uploaded successfully.!"));
});

//Get login user video
const getMyVideos = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const totalVideos = await Video.countDocuments();

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    currentPage: page,
                    totalPages: Math.ceil(totalVideos / limit),
                    limit,
                },
            },
            "All videos fetched successfully!"
        )
    );
});

//Get video details
const getVideoDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } }, // 🔥 increase view count
        { new: true }
    ).populate("owner", "username subscribersCount");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: video._id }
        });
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video details fetched successfully")
    );
});

//getVideosOfAnyChannel
const getUserVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const videos = await Video.find({ owner: userId, isPublished: true })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

//get watch history
const getWatchHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
        .populate({
            path: "watchHistory",
            options: {
                sort: { createdAt: -1 },
                skip,
                limit
            },
            select: "title thumbnail duration views owner createdAt",
            populate: {
                path: "owner",
                select: "username avatar"
            }
        });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                history: user.watchHistory,
                pagination: {
                    page,
                    limit
                }
            },
            "Watch history fetched successfully"
        )
    );
});


//Subscribe Controller
const subscribeChannel = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.user._id;

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const alreadySubscribed = await User.findOne({
        _id: userId,
        subscriptions: channelId
    });

    if (alreadySubscribed) {
        throw new ApiError(400, "Already subscribed");
    }

    await User.findByIdAndUpdate(userId, {
        $push: { subscriptions: channelId }
    });

    await User.findByIdAndUpdate(channelId, {
        $inc: { subscribersCount: 1 }
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Subscribed successfully")
    );
});

//UnsubscribeChannel
const unsubscribeChannel = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
        $pull: { subscriptions: channelId }
    });

    await User.findByIdAndUpdate(channelId, {
        $inc: { subscribersCount: -1 }
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Unsubscribed successfully")
    );
});

export {
    uploadVideos,
    getMyVideos,
    getVideoDetails,
    getUserVideos,
    getWatchHistory,
    subscribeChannel,
    unsubscribeChannel,
};
