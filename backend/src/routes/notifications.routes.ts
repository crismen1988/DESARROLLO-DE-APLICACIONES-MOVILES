import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();

router.get('/', NotificationsController.getAll);
router.post('/broadcast', requireAuth, requireRole('admin'), asyncRoute(NotificationsController.broadcast));

export default router;
