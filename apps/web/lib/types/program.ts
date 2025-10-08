export interface Program {
  id: string;
  userId: string;
  programAddress: string;
  name: string;
  description: string | null;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  status: 'pending' | 'deployed' | 'claimed' | 'expired' | 'failed';
  deploymentLogs: DeploymentLog[];
  deployedAt: string | null;
  expiresAt: string | null;
  claimedAt: string | null;
  claimedByAuthority: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLog {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
  programAddress: string;
  cluster?: 'devnet' | 'testnet' | 'mainnet-beta';
  expiresAt?: string;
}

export interface ProgramListResponse {
  programs: Program[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ProgramStats {
  totalPrograms: number;
  byStatus: {
    pending?: number;
    deployed?: number;
    claimed?: number;
    expired?: number;
    failed?: number;
  };
}

export interface AppendLogRequest {
  message: string;
  level?: 'info' | 'warn' | 'error';
}

export interface ClaimProgramRequest {
  authorityAddress: string;
}
