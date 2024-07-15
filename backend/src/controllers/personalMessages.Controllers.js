import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PersonalMessage } from "../models/personalMessages.Models.js";
// sending a msg
const sendMsg = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { receiverId } = req.params;
  console.log("receiverId:", receiverId);
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  try {
    let response;
    if (req.body.message) {
      console.log("Handling text message");
      response = await handleTextMessages(
        senderId,
        receiverId,
        req.body.message
      );
    } else if (req.files && req.files.message) {
      console.log("Handling file message");
      console.log("File details:", req.files.message[0]);
      const messagePath = req.files.message[0].path;
      console.log("messagePath:", messagePath);
      response = await handleFileMessages(senderId, receiverId, messagePath);
    } else {
      console.log("No message content found");
      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
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

const handleTextMessages = async (senderId, receiverId, message) => {
  try {
    const msg = await PersonalMessage.create({
      senderId,
      receiverId,
      message,
    });

    return new ApiResponse(201, msg, "Message sent successfully");
  } catch (error) {
    throw new ApiErrors(500, "Failed to send message", error);
  }
};

const handleFileMessages = async (senderId, receiverId, messagePath) => {
  try {
    const msgContentURL = await uploadOnCloudinary(messagePath);
    const msg = await PersonalMessage.create({
      senderId,
      receiverId,
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
  const { message } = req.body; // Extract 'message' instead of 'newMessage'

  if (!message) {
    throw new ApiErrors(400, "New message content is required");
  }

  try {
    const updatedMsg = await PersonalMessage.findOneAndUpdate(
      { _id: messageId },
      {
        $set: {
          message: message, // Use 'message' from request body
          isEdited: true,
        },
      },
      { new: true }
    );

    if (!updatedMsg) {
      throw new ApiErrors(404, "Message not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedMsg, "Message updated successfully"));
  } catch (error) {
    throw new ApiErrors(500, "Failed to update message", error);
  }
});

// DELETE A PARTICULAR MSG
const deleteMsg = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await PersonalMessage.findById(messageId);

    if (!message) {
      throw new ApiErrors(404, "Message not found");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new ApiErrors(403, "You are not authorized to delete this message");
    }

    const updatedMsg = await PersonalMessage.findOneAndUpdate(
      { _id: messageId },
      [
        {
          $set: {
            // message: "This message was deleted by you",
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

const fetchMessages = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;

  try {
    const messages = await PersonalMessage.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    const modifiedMessages = messages.map((msg) => {
      if (msg.isDeleted) {
        if (msg.senderId.toString() === senderId.toString()) {
          msg.message = "This message was deleted by you";
        } else if (msg.senderId.toString() === receiverId.toString()) {
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
    throw new ApiErrors(500, "Failed to fetch messages", error);
  }
});

export { sendMsg, editMsg, deleteMsg, fetchMessages };
