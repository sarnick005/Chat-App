import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const groupMessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true, 
    },
    senderId: {
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
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
groupMessageSchema.plugin(mongooseAggregatePaginate);

// Create model
export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);


/*
const canEditMessage = (message) => {
  const now = new Date();
  const messageCreationTime = new Date(message.createdAt);
  const diffInMinutes = (now - messageCreationTime) / 1000 / 60;

  return diffInMinutes <= 5 && !message.isDeleted;
};

// Function to edit group message
const editGroupMessage = async (messageId, newMessageContent) => {
  const message = await GroupMessage.findById(messageId);
  if (canEditMessage(message)) {
    message.message = newMessageContent;
    message.isEdited = true;
    await message.save();
    return message;
  } else {
    throw new Error("Message cannot be edited after 5 minutes or if it is deleted.");
  }
};

// Function to delete group message
const deleteGroupMessage = async (messageId) => {
  const message = await GroupMessage.findById(messageId);
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
  const editedMessage = await editGroupMessage('messageId', 'New content');
  console.log('Group message edited:', editedMessage);
} catch (error) {
  console.error(error.message);
}

try {
  const deletedMessage = await deleteGroupMessage('messageId');
  console.log('Group message deleted:', deletedMessage);
} catch (error) {
  console.error(error.message);
}
 */