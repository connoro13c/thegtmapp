import express from 'express';
import { getSegments } from '../controllers/segmentsController';

const router = express.Router();

router.get('/', getSegments);

export default router;