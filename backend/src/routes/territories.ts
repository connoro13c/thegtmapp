import express from 'express';
import { getTerritories, calculateTerritories } from '../controllers/territoriesController';

const router = express.Router();

router.get('/', getTerritories);
router.post('/calculate', calculateTerritories);

export default router;