import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const storiesSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storyContent: {
      type: String,
      required: true,
    },
    isDeleted:{
      type:Boolean,
      default:false
    },
    viewers: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

storiesSchema.plugin(mongooseAggregatePaginate);

export const Story = mongoose.model("Story", storiesSchema);
