import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProgramsRepository } from '../programs/repositories/programs.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { DeployProgramDto } from './dto/deploy-program.dto';
import { ProgramResponseDto } from '../programs/dto/program-response.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private projectsRepository: ProjectsRepository,
    private programsRepository: ProgramsRepository,
  ) {}

  async createProject(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    // Check if project name already exists for this user
    const existing = await this.projectsRepository.findByUserAndName(
      userId,
      createProjectDto.name,
    );
    if (existing) {
      throw new ConflictException(
        'Project with this name already exists for your account',
      );
    }

    const project = await this.projectsRepository.create({
      userId,
      name: createProjectDto.name,
      description: createProjectDto.description,
      cluster: createProjectDto.cluster || 'devnet',
    });

    return new ProjectResponseDto(project);
  }

  async getProject(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return new ProjectResponseDto(project);
  }

  async getProjectByName(
    userId: string,
    name: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findByUserAndName(
      userId,
      name,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return new ProjectResponseDto(project);
  }

  async listUserProjects(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsRepository.listByUser(
      userId,
      limit,
      offset,
    );
    return projects.map((p) => new ProjectResponseDto(p));
  }

  async listUserProjectsByCluster(
    userId: string,
    cluster: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsRepository.listByUserAndCluster(
      userId,
      cluster,
      limit,
      offset,
    );
    return projects.map((p) => new ProjectResponseDto(p));
  }

  async updateProject(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectsRepository.update(id, updateProjectDto);

    return this.getProject(id);
  }

  async deleteProject(id: string): Promise<void> {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectsRepository.delete(id);
  }

  async getProjectPrograms(
    projectId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProgramResponseDto[]> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const programs = await this.projectsRepository.getProgramsForProject(
      projectId,
      limit,
      offset,
    );
    return programs.map((p) => new ProgramResponseDto(p));
  }

  async getProjectStats(
    projectId: string,
  ): Promise<{ totalPrograms: number; byStatus: Record<string, number> }> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.projectsRepository.getProjectStats(projectId);
  }

  async getUserProjectCount(userId: string): Promise<number> {
    return this.projectsRepository.countByUser(userId);
  }

  /**
   * Initiate program deployment
   * This is called by the CLI and will:
   * 1. Find or create a project
   * 2. Create a pending program record
   * 3. Return the program details for the CLI to proceed
   *
   * NOTE: Actual deployment is handled by the CLI/deployment service
   * This just sets up the database records
   */
  async initiateDeployment(
    userId: string,
    deployDto: DeployProgramDto,
  ): Promise<{ project: ProjectResponseDto; programId: string }> {
    // Find or create project
    let project = await this.projectsRepository.findByUserAndName(
      userId,
      deployDto.projectName,
    );

    if (!project) {
      // Auto-create project if it doesn't exist
      project = await this.projectsRepository.create({
        userId,
        name: deployDto.projectName,
        cluster: deployDto.cluster,
      });
    }

    // Create placeholder program record (no address yet since deployment hasn't happened)
    // The CLI will update this with the actual address after deployment
    const programRecord = await this.programsRepository.create({
      userId,
      programAddress: 'pending', // Temporary placeholder
      name: deployDto.programName,
      description: deployDto.description,
      cluster: deployDto.cluster,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Link program to project
    await this.programsRepository.updateProjectId(programRecord.id, project.id);

    return {
      project: new ProjectResponseDto(project),
      programId: programRecord.id,
    };
  }
}
