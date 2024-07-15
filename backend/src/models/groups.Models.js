import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const groupSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true,
    },
    groupProfilePicture: {
      type: String,
    },
    groupDescription: {
      type: String,
    },
    groupAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted:{
      type:Boolean,
      default:false
    },
    membersId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  { timestamps: true }
);
groupSchema.plugin(mongooseAggregatePaginate);
export const Group = mongoose.model("Group", groupSchema);
