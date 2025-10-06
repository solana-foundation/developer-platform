import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { User, SafeUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private users = new Map<string, User>();
  private emailIndex = new Map<string, string>();

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const { email, password } = createUserDto;

    if (this.emailIndex.has(email)) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = this.generateApiKey();

    const user: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    this.emailIndex.set(email, user.id);

    return this.excludePassword(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return this.excludePassword(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.apiKey === apiKey) {
        return user;
      }
    }
    return null;
  }

  async regenerateApiKey(userId: string): Promise<string> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newApiKey = this.generateApiKey();
    user.apiKey = newApiKey;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return newApiKey;
  }

  private generateApiKey(): string {
    const prefix = 'sk_';
    const randomPart = uuidv4().replace(/-/g, '');
    return `${prefix}${randomPart}`;
  }

  private excludePassword(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}