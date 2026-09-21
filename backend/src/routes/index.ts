import { Router } from 'express';
import authRoutes from './auth.routes';
import toursRoutes from './tours.routes';
import placesRoutes from './places.routes';
import bookingsRoutes from './bookings.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import notificationsRoutes from './notifications.routes';
import systemRoutes from './system.routes';

const apiRouter = Router();

// Mount domain routes under /api
apiRouter.use('/auth', authRoutes);
apiRouter.use('/tours', toursRoutes);
apiRouter.use('/places', placesRoutes);
apiRouter.use('/bookings', bookingsRoutes);
apiRouter.use('/messages', chatRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/', systemRoutes);

export default apiRouter;
