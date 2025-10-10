import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { RpcProvider } from './interfaces/rpc-provider.interface';

@Injectable()
export class RpcService {
  private providers: RpcProvider[] = [];
  private readonly LOAD_BALANCER_KEY = 'rpc:load_balancer:index';

  constructor(private storageService: StorageService) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const rpcProvidersEnv = process.env.RPC_PROVIDERS;

    if (!rpcProvidersEnv) {
      throw new Error('RPC_PROVIDERS environment variable must be set');
    }

    // Parse comma-separated URLs
    const urls = rpcProvidersEnv.split(',').map((url) => url.trim());

    if (urls.length === 0) {
      throw new Error('At least one RPC provider URL must be configured');
    }

    this.providers = urls.map((url, index) => ({
      url,
      name: `Provider ${index + 1}`,
    }));

    console.log(
      `[RpcService] Initialized with ${this.providers.length} RPC providers`,
    );
  }

  private async getNextProviderIndex(): Promise<number> {
    // Atomically increment the counter in Redis
    const currentIndex = await this.storageService.incr(this.LOAD_BALANCER_KEY);

    // Use modulo to cycle through providers (convert to 0-based index)
    return (currentIndex - 1) % this.providers.length;
  }

  async forwardRequest(jsonRpcRequest: any): Promise<any> {
    const providerIndex = await this.getNextProviderIndex();
    const provider = this.providers[providerIndex];

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonRpcRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `[RpcService] Failed to forward request to ${provider.name}:`,
        error,
      );

      throw new HttpException(
        'Failed to process RPC request',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  getProvidersInfo(): { total: number; providers: string[] } {
    return {
      total: this.providers.length,
      providers: this.providers.map((p) => p.name || p.url),
    };
  }
}
