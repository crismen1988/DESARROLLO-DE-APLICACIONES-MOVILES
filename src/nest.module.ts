import {
  CanActivate, Controller, Delete, ExecutionContext, ForbiddenException, Get,
  HttpCode, Module, Post, Put, Req, Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from './security/jwt';
import { db } from './db/store';
import { AuthController } from './controllers/auth.controller';
import { ToursController } from './controllers/tours.controller';
import { PlacesController } from './controllers/places.controller';
import { BookingsController } from './controllers/bookings.controller';
import { ChatController } from './controllers/chat.controller';
import { AdminController } from './controllers/admin.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { SystemController } from './controllers/system.controller';
import { ProfileController } from './controllers/profile.controller';
import { ApiTags } from '@nestjs/swagger';

class ApiGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[] = []) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const payload = token ? verifyToken(token) : null;
    if (!payload) throw new UnauthorizedException('Token JWT requerido o inválido');
    const user = db.users.find(candidate => candidate.id === payload.sub);
    if (!user) throw new UnauthorizedException('Sesión inválida');
    payload.role = user.role;
    req.user = payload;
    if (this.allowedRoles.length && !this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Permisos insuficientes');
    }
    return true;
  }
}

const authenticated = () => UseGuards(new ApiGuard());
const roles = (...allowed: string[]) => UseGuards(new ApiGuard(allowed));

@Controller('auth')
@ApiTags('Autenticación')
class AuthApiController {
  @Post('login') @HttpCode(200) login(@Req() req: Request, @Res() res: Response) { return AuthController.login(req, res); }
  @Post('register') register(@Req() req: Request, @Res() res: Response) { return AuthController.register(req, res); }
  @Post('forgot-password') @HttpCode(200) forgotPassword(@Req() req: Request, @Res() res: Response) { return AuthController.forgotPassword(req, res); }
  @Post('reset-password') @HttpCode(200) resetPassword(@Req() req: Request, @Res() res: Response) { return AuthController.resetPassword(req, res); }
  @Post('biometric') biometric(@Req() req: Request, @Res() res: Response) { return AuthController.biometricAuth(req, res); }
  @Post('biometric/enroll') @authenticated() enrollBiometric(@Req() req: Request, @Res() res: Response) { return AuthController.enrollBiometric(req, res); }
  @Post('biometric/revoke') @authenticated() revokeBiometric(@Req() req: Request, @Res() res: Response) { return AuthController.revokeBiometric(req, res); }
  @Post('refresh') @HttpCode(200) refresh(@Req() req: Request, @Res() res: Response) { return AuthController.refresh(req, res); }
  @Post('logout') @HttpCode(200) logout(@Req() req: Request, @Res() res: Response) { return AuthController.logout(req, res); }
}

@Controller('tours')
@ApiTags('Tours')
class ToursApiController {
  @Get() getAll(@Req() req: Request, @Res() res: Response) { return ToursController.getAll(req, res); }
  @Post() @roles('operador', 'admin') create(@Req() req: Request, @Res() res: Response) { return ToursController.create(req, res); }
  @Put(':id') @roles('operador', 'admin') update(@Req() req: Request, @Res() res: Response) { return ToursController.update(req, res); }
  @Put(':id/availability') @roles('operador', 'admin') updateAvailability(@Req() req: Request, @Res() res: Response) { return ToursController.updateAvailability(req, res); }
  @Delete(':id') @roles('operador', 'admin') remove(@Req() req: Request, @Res() res: Response) { return ToursController.remove(req, res); }
}

@Controller(['places', 'puntos-interes'])
@ApiTags('Lugares')
class PlacesApiController {
  @Get() getAll(@Req() req: Request, @Res() res: Response) { return PlacesController.getAll(req, res); }
  @Get(':id') getOne(@Req() req: Request, @Res() res: Response) { return PlacesController.getOne(req, res); }
  @Post() @roles('operador', 'admin') create(@Req() req: Request, @Res() res: Response) { return PlacesController.create(req, res); }
  @Put(':id') @roles('operador', 'admin') update(@Req() req: Request, @Res() res: Response) { return PlacesController.update(req, res); }
  @Delete(':id') @roles('operador', 'admin') remove(@Req() req: Request, @Res() res: Response) { return PlacesController.remove(req, res); }
}

@Controller('bookings')
@ApiTags('Reservas')
class BookingsApiController {
  @Get() @authenticated() getAll(@Req() req: Request, @Res() res: Response) { return BookingsController.getAll(req, res); }
  @Post() @roles('turista') create(@Req() req: Request, @Res() res: Response) { return BookingsController.create(req, res); }
  @Put(':id') @authenticated() update(@Req() req: Request, @Res() res: Response) { return BookingsController.update(req, res); }
  @Delete(':id') @authenticated() remove(@Req() req: Request, @Res() res: Response) { return BookingsController.remove(req, res); }
  @Put(':id/status') @roles('operador', 'admin') updateStatus(@Req() req: Request, @Res() res: Response) { return BookingsController.updateStatus(req, res); }
}

@Controller('messages')
@ApiTags('Mensajes')
class ChatApiController {
  @Get() @authenticated() getAll(@Req() req: Request, @Res() res: Response) { return ChatController.getAll(req, res); }
  @Post() @authenticated() send(@Req() req: Request, @Res() res: Response) { return ChatController.send(req, res); }
}

@Controller('admin')
@ApiTags('Administración')
class AdminApiController {
  @Get('users') @roles('admin') getUsers(@Req() req: Request, @Res() res: Response) { return AdminController.getUsers(req, res); }
  @Put('users/:id/verify') @roles('admin') verifyUser(@Req() req: Request, @Res() res: Response) { return AdminController.verifyUser(req, res); }
  @Get('analytics') @roles('admin') getAnalytics(@Req() req: Request, @Res() res: Response) { return AdminController.getAnalytics(req, res); }
  @Put('usuarios/:id/rol') @roles('admin') setRole(@Req() req: Request, @Res() res: Response) { return AdminController.setRole(req, res); }
}

@Controller('usuarios')
@ApiTags('Perfiles')
class ProfileApiController {
  @Get('perfil') @authenticated() get(@Req() req: Request, @Res() res: Response) { return ProfileController.get(req, res); }
  @Put('perfil') @authenticated() update(@Req() req: Request, @Res() res: Response) { return ProfileController.update(req, res); }
}

@Controller('notifications')
@ApiTags('Notificaciones')
class NotificationsApiController {
  @Get() getAll(@Req() req: Request, @Res() res: Response) { return NotificationsController.getAll(req, res); }
  @Post('broadcast') @roles('admin') broadcast(@Req() req: Request, @Res() res: Response) { return NotificationsController.broadcast(req, res); }
  @Post('device') @authenticated() registerDevice(@Req() req: Request, @Res() res: Response) { return NotificationsController.registerDevice(req, res); }
  @Delete('device') @authenticated() unregisterDevice(@Req() req: Request, @Res() res: Response) { return NotificationsController.unregisterDevice(req, res); }
}

@Controller()
@ApiTags('Sistema')
class SystemApiController {
  @Get('health') getHealth(@Req() req: Request, @Res() res: Response) { return SystemController.getHealth(req, res); }
}

@Module({
  controllers: [
    AuthApiController, ToursApiController, PlacesApiController, BookingsApiController,
    ChatApiController, AdminApiController, ProfileApiController,
    NotificationsApiController, SystemApiController,
  ],
})
export class AppModule {}
