import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { asyncRoute } from './async';
import { requireAuth } from '../security/jwt';

const router = Router();

router.get('/', requireAuth, ChatController.getAll);
router.post('/', requireAuth, asyncRoute(ChatController.send));

export default router;
