import { Router } from "express";
import { FollowController } from "@module/follow/follow.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { authOptional } from "@middlewares/authOptional.middlewares";

const router = Router();
const controller = new FollowController();

router.post("/toggle/:followingId", authenticate, controller.toggleFollow.bind(controller));
// my followers/following `?page=1&limit=20`
router.get("/me/followers", authenticate, controller.getMyFollowers.bind(controller));
router.get("/me/following", authenticate, controller.getWhoIFollow.bind(controller));
// followers/following public or unauthenticate visit `?page=1&limit=20`
// use authOptional to validate access token
router.get("/followers/", authOptional, controller.getFollowers.bind(controller));
router.get("/following/", authOptional, controller.getFollowing.bind(controller));

export default router;