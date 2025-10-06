export interface User {
  id: string;
  email: string;
  password: string;
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'password'>;
