import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Group } from "../models/groups.Models.js";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary.js";
import { User } from "../models/users.Models.js";

// create group
const createGroup = asyncHandler(async (req, res) => {
  try {
    const groupAdminId = req.user._id;
    const { groupName, groupDescription } = req.body;
    if ([groupName, groupDescription].some((field) => field?.trim() === "")) {
      throw new ApiErrors(400, "All fields are required");
    }
    console.log(groupAdminId);
    console.log(groupName);
    console.log(groupDescription);

    if (!groupName || !groupDescription) {
      throw new ApiErrors(400, "Group name and description are required!");
    }

    let groupProfilePictureURL = null;
    if (req.files && req.files.groupProfilePicture) {
      const groupProfilePicturePath = req.files.groupProfilePicture[0].path;
      const uploadResult = await uploadOnCloudinary(groupProfilePicturePath);
      groupProfilePictureURL = uploadResult.url;
      console.log(groupProfilePictureURL);
    }

    const group = await Group.create({
      groupName,
      groupDescription,
      groupAdminId,
      groupProfilePicture: groupProfilePictureURL,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Group created successfully", group));
  } catch (error) {
    throw new ApiErrors(500, "Failed to create group", error);
  }
});

// add members to the group by admin
const addMembersToGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { contactUsername } = req.body;

  if (!contactUsername) {
    throw new ApiErrors(400, "Contact username is required");
  }

  const contactUser = await User.findOne({ username: contactUsername });

  if (!contactUser) {
    throw new ApiErrors(404, "User does not exist");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiErrors(404, "Group not found");
  }

  if (group.membersId.includes(contactUser._id)) {
    throw new ApiErrors(400, "User is already in the group");
  }

  const admin = await User.findById(req.user._id);

  if (!admin.contacts.includes(contactUser._id)) {
    throw new ApiErrors(400, "User is not in admin's contacts");
  }

  group.membersId.push(contactUser._id);
  await group.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, group, "Member added to the group successfully")
    );
});
// delete group
const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiErrors(404, "Group not found");
  }

  if (group.groupAdminId.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You are not authorized to delete this group");
  }

  const updateResult = await Group.updateOne(
    { _id: groupId },
    { $set: { isDeleted: true } }
  );

  if (updateResult.nModified === 0) {
    throw new ApiErrors(500, "Failed to delete the group");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group marked as deleted successfully"));
});

// edit group details
const editGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  const { groupName, groupDescription } = req.body;

  let group = await Group.findById(groupId);

  if (!group) {
    throw new ApiErrors(404, "Group not found");
  }

  if (group.groupAdminId.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You are not authorized to edit this group");
  }

  group.groupName = groupName || group.groupName;
  group.groupDescription = groupDescription || group.groupDescription;

  group = await group.save();

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Group details updated successfully"));
});
// remove members from the group
const removeMemberFromGroup = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiErrors(404, "Group not found");
  }

  const userId = req.user._id;
  if (group.groupAdminId.toString() !== userId.toString()) {
    throw new ApiErrors(
      403,
      "You are not authorized to remove members from this group"
    );
  }

  await Group.findByIdAndUpdate(groupId, {
    $pull: { membersId: memberId },
  });

  await User.findByIdAndUpdate(memberId, {
    $pull: { contacts: groupId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed from group successfully"));
});
// edit group profile photo
// check ia admin.
const checkAdmin = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new ApiErrors(404, "Group not found");
    }

    const isAdmin = group.groupAdminId.toString() === userId.toString();

    return res.status(200).json({
      isAdmin,
      groupId: group._id,
      groupName: group.groupName,
    });
  } catch (error) {
    throw new ApiErrors(500, "Failed to check admin status", error);
  }
});
// check a user in existing groups
const checkUserInGroups = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const groups = await Group.aggregate([
      {
        $match: {
          membersId: mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $project: {
          groupName: 1,
          groupDescription: 1,
          groupAdminId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      count: groups.length,
      groups,
    });
  } catch (error) {
    throw new ApiErrors(500, "Failed to fetch user's groups", error);
  }
});

export {
  createGroup,
  addMembersToGroup,
  deleteGroup,
  removeMemberFromGroup,
  checkAdmin,
  checkUserInGroups,
  editGroup,
};
