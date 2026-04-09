import { Router } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { CommentController } from "@module/comment/comment.controller";
import { optional } from "zod";
import { authOptional } from "@middlewares/authOptional.middlewares";
const router = Router();
const controller = new CommentController();
// create
router.post("/recipe/:recipeId", authenticate, controller.createComment.bind(controller));
// replies parentId -> comment parent
router.post("/recipe/reply/:parentId", authenticate, controller.createComment.bind(controller));
// update 
router.put("/recipe/:commentId", authenticate, controller.updateComment.bind(controller));
// get replies comment /recipe/replies/12-as?page=1&limit=20
router.get("/recipe/replies/:parentId", authOptional, controller.getCommentReplies.bind(controller));
// get parents comments /recipe/1423-dfs?page=1&limit=20
router.get("/recipe/:recipeId", authOptional, controller.getRecipeParentComments.bind(controller));
// delete
router.delete("/recipe/:commentId", authenticate, controller.deleteComment.bind(controller));


export default router;