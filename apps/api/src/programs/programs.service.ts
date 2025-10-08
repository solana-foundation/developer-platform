import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProgramsRepository } from './repositories/programs.repository';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramResponseDto } from './dto/program-response.dto';
import { ClaimProgramDto } from './dto/claim-program.dto';
import { AppendLogDto } from './dto/append-log.dto';

@Injectable()
export class ProgramsService {
  constructor(private programsRepository: ProgramsRepository) {}

  async createProgram(
    userId: string,
    createProgramDto: CreateProgramDto,
  ): Promise<ProgramResponseDto> {
    // Check if program address already exists
    const existing = await this.programsRepository.findByProgramAddress(
      createProgramDto.programAddress,
    );
    if (existing) {
      throw new ConflictException('Program with this address already exists');
    }

    // Create program record
    const program = await this.programsRepository.create({
      userId,
      programAddress: createProgramDto.programAddress,
      name: createProgramDto.name,
      description: createProgramDto.description,
      cluster: createProgramDto.cluster || 'devnet',
      status: 'pending',
      expiresAt: createProgramDto.expiresAt,
    });

    return new ProgramResponseDto(program);
  }

  async getProgram(id: string): Promise<ProgramResponseDto> {
    const program = await this.programsRepository.findById(id);
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return new ProgramResponseDto(program);
  }

  async getProgramByAddress(
    programAddress: string,
  ): Promise<ProgramResponseDto> {
    const program =
      await this.programsRepository.findByProgramAddress(programAddress);
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return new ProgramResponseDto(program);
  }

  async listUserPrograms(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProgramResponseDto[]> {
    const programs = await this.programsRepository.listByUser(
      userId,
      limit,
      offset,
    );
    return programs.map((p) => new ProgramResponseDto(p));
  }

  async listProgramsByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProgramResponseDto[]> {
    const programs = await this.programsRepository.listByStatus(
      status,
      limit,
      offset,
    );
    return programs.map((p) => new ProgramResponseDto(p));
  }

  async updateProgramStatus(
    id: string,
    status: string,
    deployedAt?: Date,
  ): Promise<void> {
    const program = await this.programsRepository.findById(id);
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await this.programsRepository.updateStatus(id, status, deployedAt);
  }

  async appendDeploymentLog(
    id: string,
    appendLogDto: AppendLogDto,
  ): Promise<void> {
    const program = await this.programsRepository.findById(id);
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const logEntry = {
      timestamp: new Date(),
      message: appendLogDto.message,
      level: appendLogDto.level || 'info',
    };

    await this.programsRepository.appendLog(id, logEntry);
  }

  async claimProgram(
    id: string,
    claimProgramDto: ClaimProgramDto,
  ): Promise<ProgramResponseDto> {
    const program = await this.programsRepository.findById(id);
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.status !== 'deployed') {
      throw new ConflictException('Only deployed programs can be claimed');
    }

    if (program.claimedAt) {
      throw new ConflictException('Program already claimed');
    }

    await this.programsRepository.claimAuthority(id, {
      claimedByAuthority: claimProgramDto.authorityAddress,
      claimedAt: new Date(),
    });

    return this.getProgram(id);
  }

  async expireUnclaimedPrograms(): Promise<number> {
    return this.programsRepository.expireUnclaimedPrograms();
  }

  async getUserProgramCount(userId: string): Promise<number> {
    return this.programsRepository.countByUser(userId);
  }

  async getTotalStats(): Promise<{
    totalPrograms: number;
    byStatus: Record<string, number>;
  }> {
    return this.programsRepository.getTotalStats();
  }
}
