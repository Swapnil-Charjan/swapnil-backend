import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

//Upload Video
const uploadVideos = asyncHandler(async (req, res) => {
    console.log("BODY =>", req.files);
    const { title, description, duration } = req.body;

    if (!title || !description || !duration) {
        return res
            .status(400)
            .json({ message: "All required fields are mandatory" });
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

    // const videoResp = await User.findById(video._id).select("-owner");

    return res
        .status(201)
        .json(new ApiResponse(200, video, "Video uploaded successfully.!"));
});

//Get all video
const getAllVideos = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalVideos = await Video.countDocuments();

    const videos = await Video.find()
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
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(id).populate("owner", "username email");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video details fetched successfully!..")
        );
});

export { uploadVideos, getAllVideos, getVideoDetails };
