import { Router } from "express";
import { sendStory, deleteStory } from "../controllers/story.Controller.js";
import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.Middleware.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/",
  upload.fields([{ name: "storyContent", maxCount: 1 }]),
  sendStory
);
router.delete("/:storyId", deleteStory);
export default router;
