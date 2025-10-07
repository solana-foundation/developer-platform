import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User, SafeUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UsersRepository, UserRecord } from './repositories/users.repository';
import { AuthMethodsRepository } from './repositories/auth-methods.repository';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private authMethodsRepository: AuthMethodsRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const { email, password } = createUserDto;

    // Check if email auth method already exists
    const existingAuthMethod = await this.authMethodsRepository.findByProvider(
      'email',
      email,
    );
    if (existingAuthMethod) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userRecord = await this.usersRepository.create({
      email,
      passwordHash: hashedPassword,
    });

    // Create email auth method
    await this.authMethodsRepository.create({
      userId: userRecord.id,
      provider: 'email',
      providerId: email,
      verified: false,
    });

    return this.recordToSafeUser(userRecord);
  }

  async createWalletUser(walletAddress: string): Promise<SafeUser> {
    // Check if wallet auth method already exists
    const existingAuthMethod = await this.authMethodsRepository.findByProvider(
      'wallet',
      walletAddress,
    );
    if (existingAuthMethod) {
      throw new ConflictException('User with this wallet already exists');
    }

    // Create user without email/password
    const userRecord = await this.usersRepository.create({});

    // Create wallet auth method
    await this.authMethodsRepository.create({
      userId: userRecord.id,
      provider: 'wallet',
      providerId: walletAddress,
      verified: true, // Wallet auth is verified by signature
    });

    return this.recordToSafeUser(userRecord);
  }

  async findById(id: string): Promise<User | null> {
    const userRecord = await this.usersRepository.findById(id);
    if (!userRecord) return null;
    return this.recordToUser(userRecord);
  }

  async findByEmail(email: string): Promise<User | null> {
    const authMethod = await this.authMethodsRepository.findByProvider(
      'email',
      email,
    );
    if (!authMethod) return null;

    const userRecord = await this.usersRepository.findById(authMethod.userId);
    if (!userRecord) return null;

    return this.recordToUser(userRecord);
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const authMethod = await this.authMethodsRepository.findByProvider(
      'wallet',
      walletAddress,
    );
    if (!authMethod) return null;

    const userRecord = await this.usersRepository.findById(authMethod.userId);
    if (!userRecord) return null;

    return this.recordToUser(userRecord);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.password) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return this.excludePassword(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(userId, hashedPassword);
  }

  async linkAuthMethod(
    userId: string,
    provider: string,
    providerId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if auth method already exists
    const existing = await this.authMethodsRepository.findByProvider(
      provider,
      providerId,
    );
    if (existing) {
      throw new ConflictException(
        'This authentication method is already linked to an account',
      );
    }

    await this.authMethodsRepository.create({
      userId,
      provider,
      providerId,
      metadata,
      verified: provider === 'wallet', // Auto-verify wallets
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findByApiKey(_apiKey: string): Promise<User | null> {
    // API keys are now in separate table, handled by ApiKeysRepository
    // This method is deprecated and should use ApiKeysRepository instead
    throw new Error('findByApiKey is deprecated, use ApiKeysRepository');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  regenerateApiKey(_userId: string): Promise<string> {
    // API keys are now in separate table, handled by ApiKeysRepository
    // This method is deprecated and should use ApiKeysRepository instead
    throw new Error('regenerateApiKey is deprecated, use ApiKeysRepository');
  }

  private recordToUser(record: UserRecord): User {
    return {
      id: record.id,
      email: record.email || '',
      password: record.passwordHash || '',
      apiKey: undefined, // Deprecated, moved to api_keys table
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private recordToSafeUser(record: UserRecord): SafeUser {
    return {
      id: record.id,
      email: record.email || '',
      apiKey: undefined, // Deprecated, moved to api_keys table
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private excludePassword(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
