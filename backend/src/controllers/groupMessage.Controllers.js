import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GroupMessage } from "../models/groupMessages.Models.js";
// sending a msg
const sendMsg = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const senderId = req.user._id;
  const { message } = req.body;
  console.log("Group ID:", groupId);
  console.log("Sender ID:", senderId);
  console.log("Message:", message);
  console.log("Files:", req.files);

  try {
    let response;
    if (message) {
      console.log("Handling text message");
      response = await handleTextMessages(senderId, groupId, message);
    } else if (req.files && req.files.message) {
      console.log("Handling file message");
      const messagePath = req.files.message[0].path;
      response = await handleFileMessages(senderId, groupId, messagePath);
    } else {
      console.log("No message content found");
      throw new ApiErrors(400, "Message content not provided");
    }
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error in sendMsg:", error);
    throw new ApiErrors(
      error.status || 500,
      error.message || "Failed to send message"
    );
  }
});

const handleTextMessages = async (senderId, groupId, message) => {
  try {
    const msg = await GroupMessage.create({
      senderId,
      groupId,
      message,
    });
    return new ApiResponse(201, msg, "Message sent successfully");
  } catch (error) {
    throw new ApiErrors(500, "Failed to send message", error);
  }
};

const handleFileMessages = async (senderId, groupId, messagePath) => {
  try {
    const msgContentURL = await uploadOnCloudinary(messagePath);
    const msg = await GroupMessage.create({
      senderId,
      groupId,
      message: msgContentURL.url,
    });
    return new ApiResponse(201, msg, "Message sent successfully");
  } catch (error) {
    throw new ApiErrors(500, "Failed to send message", error);
  }
};

// EDIT A PARTICULAR MSG
const editMsg = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { message } = req.body;
  const userId = req.user._id;

  if (!message) {
    throw new ApiErrors(400, "New message content is required");
  }

  try {
    const msg = await GroupMessage.findById(messageId);

    if (!msg) {
      throw new ApiErrors(404, "Message not found");
    }

    if (msg.senderId.toString() !== userId.toString()) {
      throw new ApiErrors(403, "You are not authorized to edit this message");
    }

    const updatedMsg = await GroupMessage.findOneAndUpdate(
      { _id: messageId },
      {
        $set: {
          message: message,
          isEdited: true,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedMsg, "Message updated successfully"));
  } catch (error) {
    console.error("Error updating message:", error);
    throw new ApiErrors(500, "Failed to update message", error);
  }
});

// DELETE A PARTICULAR MSG
const deleteMsg = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await GroupMessage.findById(messageId);

    if (!message) {
      throw new ApiErrors(404, "Message not found");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new ApiErrors(403, "You are not authorized to delete this message");
    }

    const updatedMsg = await GroupMessage.findOneAndUpdate(
      { _id: messageId },
      [
        {
          $set: {
            isDeleted: true,
          },
        },
      ],
      { new: true }
    );

    if (!updatedMsg) {
      throw new ApiErrors(404, "Message not found after update");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedMsg, "Message deleted successfully"));
  } catch (error) {
    throw new ApiErrors(500, "Failed to delete message", error);
  }
});

// FETCH ALL MSG BETWEEN TWO USERS

const fetchGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    const messages = await GroupMessage.find({
      groupId: groupId,
    }).sort({ createdAt: 1 });

    const modifiedMessages = messages.map((msg) => {
      if (msg.isDeleted) {
        if (msg.senderId.toString() === userId.toString()) {
          msg.message = "This message was deleted by you";
        } else {
          msg.message = "This message was deleted by the sender";
        }
      }
      return msg;
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, modifiedMessages, "Messages fetched successfully")
      );
  } catch (error) {
    console.error("Error fetching group messages:", error);
    throw new ApiErrors(500, "Failed to fetch group messages", error);
  }
});


export { sendMsg, editMsg, deleteMsg, fetchGroupMessages };
