import express from 'express';
import * as userController from '../controllers/user.controller';
import { authorizedUser } from '../middleware/authProtect';

const router = express.Router();

router.use(authorizedUser) //better way to secure all routes at ones

router.get('/', userController.getUser);

router.put('/onboarding', userController.userOnboarding);

router.put('/update-profile', userController.updateProfile);

router.post('/upload-photo', userController.uploadFile);

router.delete('/delete-photo', userController.deleteFile);

router.put( '/change-password', userController.changePassword);

router.post('/rate-app', userController.rateApp);

router.delete('/delete-account', userController.deleteAccount);

router.post('/request-feature', userController.requestFeature);

router.post('/report-bug', userController.reportBug);

export default router;