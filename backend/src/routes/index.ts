import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';
import { getTasks } from '../controllers/task.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

// Additional endpoint explicitly listed in prompt: GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', authenticateToken, (req, res, next) => {
  req.query.projectId = req.params.projectId;
  getTasks(req, res, next);
});

export default router;
