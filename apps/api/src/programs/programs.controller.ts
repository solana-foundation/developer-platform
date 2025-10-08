import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ClaimProgramDto } from './dto/claim-program.dto';
import { AppendLogDto } from './dto/append-log.dto';
import { ProgramResponseDto } from './dto/program-response.dto';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  async createProgram(
    @Request() req,
    @Body() createProgramDto: CreateProgramDto,
  ): Promise<ProgramResponseDto> {
    const userId = req.user.userId;
    return this.programsService.createProgram(userId, createProgramDto);
  }

  @Get()
  async listUserPrograms(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ProgramResponseDto[]> {
    const userId = req.user.userId;
    return this.programsService.listUserPrograms(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('stats')
  async getTotalStats(): Promise<{
    totalPrograms: number;
    byStatus: Record<string, number>;
  }> {
    return this.programsService.getTotalStats();
  }

  @Get(':id')
  async getProgram(@Param('id') id: string): Promise<ProgramResponseDto> {
    return this.programsService.getProgram(id);
  }

  @Get('address/:programAddress')
  async getProgramByAddress(
    @Param('programAddress') programAddress: string,
  ): Promise<ProgramResponseDto> {
    return this.programsService.getProgramByAddress(programAddress);
  }

  @Post(':id/logs')
  async appendLog(
    @Param('id') id: string,
    @Body() appendLogDto: AppendLogDto,
  ): Promise<{ message: string }> {
    await this.programsService.appendDeploymentLog(id, appendLogDto);
    return { message: 'Log appended successfully' };
  }

  @Post(':id/claim')
  async claimProgram(
    @Param('id') id: string,
    @Body() claimProgramDto: ClaimProgramDto,
  ): Promise<ProgramResponseDto> {
    return this.programsService.claimProgram(id, claimProgramDto);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; deployedAt?: string },
  ): Promise<{ message: string }> {
    await this.programsService.updateProgramStatus(
      id,
      body.status,
      body.deployedAt ? new Date(body.deployedAt) : undefined,
    );
    return { message: 'Status updated successfully' };
  }
}
