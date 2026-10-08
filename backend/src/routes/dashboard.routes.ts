import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Dashboard route requires authentication
router.use(authenticateToken);

router.get('/', getDashboardStats);
router.get('/stats', getDashboardStats);

export default router;
