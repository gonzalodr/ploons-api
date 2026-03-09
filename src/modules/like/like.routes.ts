import { Router } from "express";
import { LikeController } from "@module/like/like.controller";
import { authenticate } from "@middlewares/auth.middleware";
import { authOptional } from "@middlewares/authOptional.middlewares";

const router = Router();
const controller = new LikeController();

// toggle like
router.post("/recipe/toggle/:recipeId", authenticate, controller.likeOrUnlikeRecipe.bind(controller));
// GET recipe/123-abc?page=1&limit=10
// public endpoint
router.get("/recipe/:recipeId", authOptional, controller.getRecipeLikes.bind(controller));
// GET recipe/:recipeId/status
router.get("/recipe/:recipeId/status", authenticate, controller.getLikeStatus.bind(controller));

export default router;