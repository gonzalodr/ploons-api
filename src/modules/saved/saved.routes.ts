import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { SavedController } from "src/modules/saved/saved.controller";

const router = Router();
const controller = new SavedController();
// save/unsave
router.post("/:recipeId", authenticate, controller.toggleSave.bind(controller));
// get my saves
router.get("/me", authenticate, controller.getMySavedRecipes.bind(controller));

export default router;