import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const uploadVideos = asyncHandler(async (req, res) => {
    const { title, description, duration } = req.body;
    console.log(">>>>>>>>>>>>>>>>>>".req.body);

    if (!title || !description || !duration) {
        return res
            .status(400)
            .json({ message: "All required fields are mandatory" });
    }

    const videofilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnailPath[0]?.path;

    //Check videoFile required
    if (!videofilePath) {
        throw new ApiError(400, "Video is file requied");
    }

    //Check thumbnail required
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is file requied");
    }

    const video = await Video.create({
        videoFile: videofilePath,
        thumbnail: thumbnailPath,
        title,
        description,
        duration,
        owner: req.user?._id, // if using auth middleware
    });

    const videoResp = await User.findById(video._id).select("-owner");

    return res
        .status(201)
        .json(new ApiResponse(200, videoResp, "Video uploaded successfully.!"));
});

export { uploadVideos };
