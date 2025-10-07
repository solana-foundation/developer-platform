import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { AirdropResponseDto, CreateAirdropDto } from './airdrop.dto';
import { AirdropsRepository } from './repositories/airdrops.repository';
import {
  address,
  createSolanaClient,
  createKeyPairSignerFromBytes,
  LAMPORTS_PER_SOL,
  lamports,
  createTransaction,
} from 'gill';
import { getTransferSolInstruction } from '@solana-program/system';
import { randomUUID } from 'crypto';

@Injectable()
export class AirdropService {
  private client: ReturnType<typeof createSolanaClient>;
  private payer: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>;
  private initPromise: Promise<void>;

  constructor(
    private storageService: StorageService,
    private airdropsRepository: AirdropsRepository,
  ) {
    const rpcUrl = process.env.RPC_URL;
    const keypairSecret = process.env.KEYPAIR;

    if (!rpcUrl || !keypairSecret) {
      throw new Error('RPC_URL and KEYPAIR environment variables must be set');
    }

    this.client = createSolanaClient({ urlOrMoniker: rpcUrl });
    this.initPromise = this.initialize(keypairSecret);
  }

  private async initialize(keypairSecret: string) {
    this.payer = await createKeyPairSignerFromBytes(
      new Uint8Array(JSON.parse(keypairSecret)),
    );
  }

  async createAirdrop(
    userId: string,
    createAirdropDto: CreateAirdropDto,
  ): Promise<AirdropResponseDto> {
    await this.initPromise;

    const { address: recipientAddress } = createAirdropDto;

    try {
      const { sendAndConfirmTransaction } = this.client;

      const transferInstruction = getTransferSolInstruction({
        source: this.payer,
        destination: address(recipientAddress),
        amount: lamports(BigInt(createAirdropDto.amount * LAMPORTS_PER_SOL)),
      });

      const transactionInput = createTransaction({
        feePayer: this.payer,
        instructions: [transferInstruction],
      });

      const signature = await sendAndConfirmTransaction(transactionInput);
      const transaction = await this.client.rpc
        .getTransaction(signature)
        .send();
      // TODO: Handle case where transaction is not found aka retries
      const slot = transaction?.slot ?? BigInt(0);

      const airdropId = randomUUID();
      const response = new AirdropResponseDto(signature, Number(slot));

      // PostgreSQL: Fire-and-forget write for permanent audit trail
      this.airdropsRepository
        .create({
          userId,
          signature,
          slot: Number(slot),
          recipient: recipientAddress,
          amount: createAirdropDto.amount,
          status: 'confirmed',
        })
        .catch((err) =>
          console.error(
            '[AirdropService] Failed to store airdrop in PostgreSQL:',
            err,
          ),
        );

      // Store in Redis cache with 24 hour TTL (86400 seconds)
      const ttl = parseInt(process.env.AIRDROP_TTL || '86400');
      await this.storageService.set(
        `airdrop:${airdropId}`,
        JSON.stringify(response),
        ttl,
      );

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to airdrop SOL: ${message}`);
    }
  }

  async getAirdrop(id: string): Promise<AirdropResponseDto | null> {
    const airdropJson = await this.storageService.get(`airdrop:${id}`);
    if (!airdropJson) return null;

    const airdrop = JSON.parse(airdropJson) as AirdropResponseDto;
    return airdrop;
  }
}
