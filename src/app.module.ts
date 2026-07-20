import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { PointsOfInterestModule } from './points-of-interest/points-of-interest.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),

    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    PointsOfInterestModule,
    ReviewsModule,
    FavoritesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
