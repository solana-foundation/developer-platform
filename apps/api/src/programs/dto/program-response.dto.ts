export class ProgramResponseDto {
  id: string;
  userId: string;
  programAddress: string;
  name: string;
  description: string | null;
  cluster: string;
  status: string;
  deploymentLogs: any[];
  deployedAt: Date | null;
  expiresAt: Date | null;
  claimedAt: Date | null;
  claimedByAuthority: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    userId: string;
    programAddress: string;
    name: string;
    description: string | null;
    cluster: string;
    status: string;
    deploymentLogs: any[];
    deployedAt: Date | null;
    expiresAt: Date | null;
    claimedAt: Date | null;
    claimedByAuthority: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.programAddress = data.programAddress;
    this.name = data.name;
    this.description = data.description;
    this.cluster = data.cluster;
    this.status = data.status;
    this.deploymentLogs = data.deploymentLogs;
    this.deployedAt = data.deployedAt;
    this.expiresAt = data.expiresAt;
    this.claimedAt = data.claimedAt;
    this.claimedByAuthority = data.claimedByAuthority;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
