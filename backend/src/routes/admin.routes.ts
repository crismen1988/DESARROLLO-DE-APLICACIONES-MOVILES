import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', AdminController.getUsers);
router.put('/users/:id/verify', asyncRoute(AdminController.verifyUser));
router.get('/analytics', AdminController.getAnalytics);

export default router;
