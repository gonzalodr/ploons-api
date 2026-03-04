import { Router } from "express";
import { SearchController } from "src/modules/search/search.controller";

const router = Router();
const controller = new SearchController();

router.get("/recipes", controller.searchRecipe.bind(controller));
router.get("/profiles", controller.searchProfile.bind(controller));

export default router;