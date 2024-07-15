import { Router } from "express";
import {
  sendMsg,
  editMsg,
  deleteMsg,
  fetchGroupMessages,
} from "../controllers/groupMessage.Controllers.js";

import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.Middleware.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/:groupId",
  upload.fields([{ name: "message", maxCount: 1 }]),
  sendMsg
);

router.patch("/:messageId", editMsg);
router.delete("/:messageId", deleteMsg);
router.get("/:groupId/messages", fetchGroupMessages);

export default router;
