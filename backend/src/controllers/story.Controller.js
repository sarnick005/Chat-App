import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Story } from "../models/stories.Model.js"; 
// Post a story
const sendStory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  try {
    let response;
    if (req.body.storyContent) {
      console.log("Handling text story");
      response = await handleTextStory(userId, req.body.storyContent);
    } else if (req.files && req.files.storyContent) {
      console.log("Handling file story");
      console.log("File details:", req.files.storyContent[0]);
      const storyPath = req.files.storyContent[0].path;
      console.log("storyPath:", storyPath);
      response = await handleFileStory(userId, storyPath);
    } else {
      console.log("No story content found");
      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
      throw new ApiErrors(400, "Story content not provided");
    }
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error in sendStory:", error);
    throw new ApiErrors(
      error.status || 500,
      error.message || "Failed to upload story"
    );
  }
});

const handleTextStory = async (userId, storyContent) => {
  try {
    const story = await Story.create({
      userId,
      storyContent,
    });

    return new ApiResponse(201, story, "Story uploaded successfully");
  } catch (error) {
    throw new ApiErrors(500, "Failed to upload story", error);
  }
};

const handleFileStory = async (userId, storyPath) => {
  try {
    const storyContentURL = await uploadOnCloudinary(storyPath);
    const story = await Story.create({
      userId,
      storyContent: storyContentURL.url,
    });

    return new ApiResponse(201, story, "Story uploaded successfully");
  } catch (error) {
    throw new ApiErrors(500, "Failed to upload story", error);
  }
};
// Delete story
const deleteStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user._id;

  try {
    const story = await Story.findById(storyId);

    if (!story) {
      throw new ApiErrors(404, "Story not found");
    }

    if (story.userId.toString() !== userId.toString()) {
      throw new ApiErrors(403, "You are not authorized to delete this story");
    }

    const updatedStory = await Story.findOneAndUpdate(
      { _id: storyId },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!updatedStory) {
      throw new ApiErrors(404, "Story not found after update");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedStory, "Story deleted successfully"));
  } catch (error) {
    throw new ApiErrors(500, "Failed to delete story", error);
  }
});

export { sendStory,deleteStory };
