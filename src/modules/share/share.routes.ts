import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { ShareController } from "@module/share/share.controller";

const router = Router();
const controller = new ShareController();

// 1. register share
// POST /api/v1/share
router.post("/", authenticate, controller.registerShare.bind(controller));

// 2. get my shared recipes
// GET /api/v1/share/me?page=1&limit=10
router.get("/me", authenticate, controller.getMySharedRecipes.bind(controller));

export default router;
