import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();

router.get('/health', asyncRoute(SystemController.getHealth));
router.get('/system/architecture', requireAuth, requireRole('admin'), SystemController.getArchitecture);
router.post('/security/encrypt', requireAuth, requireRole('admin'), SystemController.encrypt);
router.post('/security/decrypt', requireAuth, requireRole('admin'), SystemController.decrypt);

export default router;
