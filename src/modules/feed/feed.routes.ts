import { Router } from "express";
import { FeedController } from "src/modules/feed/feed.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { authOptional } from "@middlewares/authOptional.middlewares";

const router = Router();
const controller = new FeedController();
// private endpoint feed/post of following
router.get("/", authenticate, controller.getFollowingFeed.bind(controller));
// public endpoint
router.get("/trending", authOptional, controller.getTrending.bind(controller));

export default router;