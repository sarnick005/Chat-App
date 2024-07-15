import { Router } from "express";
import {
  sendMsg,
  editMsg,
  deleteMsg,
  fetchMessages,
} from "../controllers/personalMessages.Controllers.js";

import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.Middleware.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/:receiverId",
  upload.fields([{ name: "message", maxCount: 1 }]),
  sendMsg
);

router.patch("/:messageId", editMsg);
router.delete("/:messageId", deleteMsg);
router.get("/:receiverId", fetchMessages);

export default router;
