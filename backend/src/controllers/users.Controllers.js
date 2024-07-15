import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/users.Models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getCookieOptions } from "../utils/getCookieOptions.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, bio } = req.body;
  if ([username, password, bio].some((field) => field?.trim() === "")) {
    throw new ApiErrors(400, "All fields are required");
  }
  const existedUser = await User.findOne({ username });
  if (existedUser) {
    throw new ApiErrors(409, "User with username already exists");
  }

  const profilePicLocalPath = req.files?.profilePicture[0]?.path;
  if (!profilePicLocalPath) {
    throw new ApiErrors(400, "Profile Picture is required");
  }

  const profilePicture = await uploadOnCloudinary(profilePicLocalPath);

  if (!profilePicture) {
    throw new ApiErrors(400, "Profile Picture file is required");
  }

  const user = await User.create({
    profilePicture: profilePicture.url,
    password,
    username,
    bio,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(500, "Something went wrong while registering the user");
  }

  console.log(`USER ${createdUser.username} REGISTERED`);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log("Login Details");
  console.log(req.body);
  if (!username) {
    throw new ApiErrors(400, "username is required");
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiErrors(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiErrors(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = getCookieOptions();
  console.log(`USER ${loggedInUser.username} LOGGED IN`);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = getCookieOptions();
  console.log("USER LOGGED OUT");
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// ADD TO CONTACT
const addToContact = asyncHandler(async (req, res) => {
  const { contactUsername } = req.body;

  if (!contactUsername) {
    throw new ApiErrors(400, "Contact username is required");
  }

  const contactUser = await User.findOne({ username: contactUsername });

  if (!contactUser) {
    throw new ApiErrors(404, "User does not exist");
  }

  const currentUser = await User.findById(req.user._id);

  if (currentUser.contacts.includes(contactUser._id)) {
    throw new ApiErrors(400, "User is already in contacts");
  }

  currentUser.contacts.push(contactUser._id);
  await currentUser.save();

  return res
    .status(200)
    .json(new ApiResponse(200, currentUser, "Contact added successfully"));
});

// REFRESH ACCESS TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiErrors(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiErrors(401, "Refresh token is expired or used");
    }

    const options = getCookieOptions();

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid refresh token");
  }
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// GET ALL CONTACTS
const getAllContacts = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  try {
    const contacts = await User.aggregate([
      { $match: { _id: currentUserId } },
      { $unwind: "$contacts" },
      {
        $lookup: {
          from: "users",
          localField: "contacts",
          foreignField: "_id",
          as: "contactDetails",
        },
      },
      { $unwind: "$contactDetails" },
      {
        $project: {
          _id: "$contactDetails._id",
          username: "$contactDetails.username",
          profilePicture: "$contactDetails.profilePicture",
          bio: "$contactDetails.bio",
        },
      },
    ]);

    if (!contacts.length) {
      throw new ApiErrors(404, "No contacts found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, contacts, "Contacts fetched successfully"));
  } catch (error) {
    throw new ApiErrors(500, "Failed to fetch contacts", error);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  addToContact,
  getAllContacts,
};
