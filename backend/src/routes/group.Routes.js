import { Router } from "express";
import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.Middleware.js";
import {
  createGroup,
  addMembersToGroup,
  deleteGroup,
  removeMemberFromGroup,
  checkAdmin,
  checkUserInGroups,
} from "../controllers/groups.Controllers.js";
const router = Router();

router.use(verifyJWT);
router.post(
  "/create",
  upload.fields([{ name: "groupProfilePicture", maxCount: 1 }]),
  createGroup
);
router.post("/add-member/:groupId", addMembersToGroup);
router.delete("/:groupId", deleteGroup);
router.delete("/:groupId/members/:memberId", removeMemberFromGroup);
router.get("/:groupId/admin", checkAdmin);
router.delete("/check-user-groups", checkUserInGroups);
export default router;
