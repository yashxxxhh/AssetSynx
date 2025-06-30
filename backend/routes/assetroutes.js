import express from 'express';
import { addAsset, getAssets } from '../controlle/assetController.js';
import verifyToken from './auth.js';

const router = express.Router();

router.get('/', verifyToken, getAssets);
router.post('/', verifyToken, addAsset);

export default router;
