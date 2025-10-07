import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { AuthMethodsRepository } from './repositories/auth-methods.repository';

@Module({
  providers: [UsersService, UsersRepository, AuthMethodsRepository],
  exports: [UsersService, UsersRepository, AuthMethodsRepository],
})
export class UsersModule {}
