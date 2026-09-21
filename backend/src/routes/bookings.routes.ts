import { Router } from 'express';
import { BookingsController } from '../controllers/bookings.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();

router.get('/', requireAuth, BookingsController.getAll);
router.post('/', requireAuth, requireRole('turista'), asyncRoute(BookingsController.create));
router.put('/:id/status', requireAuth, requireRole('operador', 'admin'), asyncRoute(BookingsController.updateStatus));

export default router;
