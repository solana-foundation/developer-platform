import { ProjectRecord } from '../repositories/projects.repository';

export class ProjectResponseDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cluster: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(project: ProjectRecord) {
    this.id = project.id;
    this.userId = project.userId;
    this.name = project.name;
    this.description = project.description;
    this.cluster = project.cluster;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }
}
