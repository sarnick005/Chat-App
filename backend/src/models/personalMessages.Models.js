import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const personalMessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, 
    },
    message: {
      type: String,
      required: true,
      minlength: 1, 
      maxlength: 1000, 
    },
    read: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
personalMessageSchema.plugin(mongooseAggregatePaginate);

export const PersonalMessage = mongoose.model(
  "PersonalMessage",
  personalMessageSchema
);
/*
const canEditMessage = (message) => {
  const now = new Date();
  const messageCreationTime = new Date(message.createdAt);
  const diffInMinutes = (now - messageCreationTime) / 1000 / 60;

  return diffInMinutes <= 5 && !message.isDeleted;
};

// Function to edit message
const editMessage = async (messageId, newMessageContent) => {
  const message = await PersonalMessage.findById(messageId);
  if (canEditMessage(message)) {
    message.message = newMessageContent;
    message.isEdited = true;
    await message.save();
    return message;
  } else {
    throw new Error("Message cannot be edited after 5 minutes or if it is deleted.");
  }
};

// Function to delete message
const deleteMessage = async (messageId) => {
  const message = await PersonalMessage.findById(messageId);
  if (message) {
    message.isDeleted = true;
    await message.save();
    return message;
  } else {
    throw new Error("Message not found.");
  }
};

// Example usage:
try {
  const editedMessage = await editMessage('messageId', 'New content');
  console.log('Message edited:', editedMessage);
} catch (error) {
  console.error(error.message);
}

try {
  const deletedMessage = await deleteMessage('messageId');
  console.log('Message deleted:', deletedMessage);
} catch (error) {
  console.error(error.message);
}
 */