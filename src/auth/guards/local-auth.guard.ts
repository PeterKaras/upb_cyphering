import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body.email;
    const password = request.body.password;
    try {
      request.user = await this.authService.validateUser(email, password);
      return true;
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }
}
