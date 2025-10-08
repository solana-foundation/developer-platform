import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeployProgramDto } from './dto/deploy-program.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Request() req,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(
      req.user.userId,
      createProjectDto,
    );
  }

  @Get()
  async listProjects(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('cluster') cluster?: string,
  ) {
    if (cluster) {
      return this.projectsService.listUserProjectsByCluster(
        req.user.userId,
        cluster,
        limit,
        offset,
      );
    }
    return this.projectsService.listUserProjects(
      req.user.userId,
      limit,
      offset,
    );
  }

  @Get(':id')
  async getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Get(':id/programs')
  async getProjectPrograms(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.projectsService.getProjectPrograms(id, limit, offset);
  }

  @Get(':id/stats')
  async getProjectStats(@Param('id') id: string) {
    return this.projectsService.getProjectStats(id);
  }

  @Put(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Param('id') id: string) {
    await this.projectsService.deleteProject(id);
  }

  /**
   * CLI Deploy Endpoint
   * Called by the CLI to initiate a program deployment
   * Returns project info and program ID for tracking
   */
  @Post('deploy')
  async initiateDeployment(
    @Request() req,
    @Body() deployDto: DeployProgramDto,
  ) {
    return this.projectsService.initiateDeployment(req.user.userId, deployDto);
  }
}
