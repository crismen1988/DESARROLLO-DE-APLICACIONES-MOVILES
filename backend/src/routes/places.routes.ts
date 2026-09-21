import { Router } from 'express';
import { PlacesController } from '../controllers/places.controller';
import { asyncRoute } from './async';
import { requireAuth, requireRole } from '../security/jwt';

const router = Router();

router.get('/', PlacesController.getAll);
router.post('/', requireAuth, requireRole('operador', 'admin'), asyncRoute(PlacesController.create));

export default router;
