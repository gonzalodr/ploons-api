import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { RecipeController } from "src/modules/recipe/recipe.controller";
import { } from "@middlewares/multer.middleware";
import { uploadSingle, validateImage } from "@middlewares/multer.middleware";
const router = Router();
const controller = new RecipeController();

// 1. list
// GET /me?page=1&limit=10
router.get('/me', authenticate, controller.getMyListRecipe.bind(controller));

// 2. get by ids
router.get("/:recipeId", controller.getRecipeById.bind(controller));
router.get("/private/:recipeId", authenticate, controller.getPrivateRecipeById.bind(controller));

// 3. crud
router.post("/", authenticate, uploadSingle('image'), validateImage, controller.createRecipe.bind(controller));
router.put("/:recipeId", authenticate, uploadSingle('image'), validateImage, controller.updateRecipe.bind(controller));
router.delete("/:recipeId", authenticate, controller.deleteRecipe.bind(controller));

export default router;