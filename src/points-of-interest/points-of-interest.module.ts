import { Module } from '@nestjs/common';
import { PointsOfInterestService } from './points-of-interest.service';
import { PointsOfInterestController } from './points-of-interest.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PointsOfInterestController],
  providers: [PointsOfInterestService],
})
export class PointsOfInterestModule {}
