import express from 'express';
import { getAccounts, getAccountById, createAccount, updateAccount, scoreAccount } from '../controllers/accountsController';

const router = express.Router();

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.post('/score', scoreAccount);

export default router;