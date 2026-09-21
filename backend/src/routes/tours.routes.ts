import { Router } from 'express';
import { ToursController } from '../controllers/tours.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();

router.get('/', ToursController.getAll);
router.post('/', requireAuth, requireRole('operador', 'admin'), asyncRoute(ToursController.create));
router.put('/:id', requireAuth, requireRole('operador', 'admin'), asyncRoute(ToursController.update));
router.put('/:id/availability', requireAuth, requireRole('operador', 'admin'), asyncRoute(ToursController.updateAvailability));
router.delete('/:id', requireAuth, requireRole('operador', 'admin'), asyncRoute(ToursController.remove));

export default router;
