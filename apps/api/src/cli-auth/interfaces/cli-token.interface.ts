export interface CliAuthSession {
  token: string;
  userId?: string;
  status: 'pending' | 'verified' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  browserUrl: string;
}
