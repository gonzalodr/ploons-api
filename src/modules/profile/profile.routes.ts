import { Router } from 'express';
import { ProfileController } from 'src/modules/profile/profile.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { upload } from '@middlewares/multer.middleware';
import { authOptional } from '@middlewares/authOptional.middlewares';

const router = Router();
const profileController = new ProfileController();

router.get("/me",authenticate,profileController.getMyProfile.bind(profileController));
router.put("/me",authenticate,upload.single("avatar"),profileController.updateProfile.bind(profileController));
router.get("/:profileId",authOptional,profileController.getProfileById.bind(profileController));

export default router;