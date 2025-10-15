import { API_BASE_URL } from '@/lib/config/env';

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in: 'path' | 'query' | 'body';
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  parameters: ApiParameter[];
  requestBody?: {
    type: string;
    properties: Record<
      string,
      { type: string; description: string; example?: any }
    >;
  };
  responseExample: any;
  generateCurl: (
    apiKey: string,
    params: Record<string, any>,
    baseUrl: string,
  ) => string;
  generateTypeScript: (
    apiKey: string,
    params: Record<string, any>,
    baseUrl: string,
  ) => string;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // Wallet Endpoints
  {
    id: 'get-token-balances',
    method: 'GET',
    path: '/:address/balances',
    category: 'Wallet',
    title: 'Get SPL Token Balances',
    description: 'Retrieve all SPL token balances for a given wallet address',
    requiresAuth: true,
    parameters: [
      {
        name: 'address',
        type: 'string',
        required: true,
        description: 'Solana wallet address',
        in: 'path',
        example: '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of token balances to return',
        in: 'query',
        example: '10',
      },
    ],
    responseExample: {
      address: '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF',
      balances: [
        {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          balance: '100.5',
          decimals: 6,
          tokenAccount: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      ],
    },
    generateCurl: (apiKey, params, baseUrl) => {
      const limitParam = params.limit ? `?limit=${params.limit}` : '';
      return `curl -X GET "${baseUrl}/${params.address}/balances${limitParam}" \\
  -H "Authorization: Bearer ${apiKey}"`;
    },
    generateTypeScript: (apiKey, params, baseUrl) => {
      const limitParam = params.limit ? `?limit=${params.limit}` : '';
      return `const response = await fetch('${baseUrl}/${params.address}/balances${limitParam}', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`;
    },
  },

  // Airdrop Endpoints
  {
    id: 'request-airdrop',
    method: 'POST',
    path: '/airdrop',
    category: 'Airdrop',
    title: 'Request SOL Airdrop',
    description: 'Request a SOL airdrop to a specified wallet address',
    requiresAuth: true,
    parameters: [],
    requestBody: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Recipient wallet address',
          example: '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF',
        },
        amount: {
          type: 'number',
          description: 'Amount of SOL to airdrop',
          example: 0.5,
        },
      },
    },
    responseExample: {
      signature:
        '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
      slot: 123456789,
    },
    generateCurl: (
      apiKey,
      params,
      baseUrl,
    ) => `curl -X POST "${baseUrl}/airdrop" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "${params.address || '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF'}",
    "amount": ${params.amount || 0.5}
  }'`,
    generateTypeScript: (
      apiKey,
      params,
      baseUrl,
    ) => `const response = await fetch('${baseUrl}/airdrop', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: '${params.address || '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF'}',
    amount: ${params.amount || 0.5}
  })
});

const data = await response.json();
console.log(data);`,
  },

  {
    id: 'get-airdrop-history',
    method: 'GET',
    path: '/airdrop/history',
    category: 'Airdrop',
    title: 'Get Airdrop History',
    description:
      'Retrieve paginated airdrop history for the authenticated user',
    requiresAuth: true,
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of records to return (default: 50)',
        in: 'query',
        example: '10',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of records to skip (default: 0)',
        in: 'query',
        example: '0',
      },
    ],
    responseExample: {
      airdrops: [
        {
          id: 'abc123',
          signature:
            '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
          recipient: '4kg8oh3jdNtn7j2wcS7TrUua31AgbLzDVkBZgTAe44aF',
          amount: 0.5,
          status: 'confirmed',
          createdAt: '2025-01-10T12:00:00.000Z',
          explorerUrl:
            'https://solscan.io/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW?cluster=devnet',
        },
      ],
      pagination: {
        total: 100,
        limit: 10,
        offset: 0,
        hasMore: true,
      },
    },
    generateCurl: (
      apiKey,
      params,
      baseUrl,
    ) => `curl -X GET "${baseUrl}/airdrop/history?limit=${params.limit || 10}&offset=${params.offset || 0}" \\
  -H "Authorization: Bearer ${apiKey}"`,
    generateTypeScript: (
      apiKey,
      params,
      baseUrl,
    ) => `const response = await fetch('${baseUrl}/airdrop/history?limit=${params.limit || 10}&offset=${params.offset || 0}', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
  },

  // Programs Endpoints
  {
    id: 'create-program',
    method: 'POST',
    path: '/programs',
    category: 'Programs',
    title: 'Create Program',
    description: 'Create a new Solana program deployment',
    requiresAuth: true,
    parameters: [],
    requestBody: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Program name',
          example: 'my-solana-program',
        },
        description: {
          type: 'string',
          description: 'Program description',
          example: 'My awesome Solana program',
        },
        cluster: {
          type: 'string',
          description: 'Solana cluster (devnet, testnet, mainnet-beta)',
          example: 'devnet',
        },
      },
    },
    responseExample: {
      id: 'prog_123',
      name: 'my-solana-program',
      description: 'My awesome Solana program',
      programAddress: '11111111111111111111111111111111',
      cluster: 'devnet',
      status: 'pending',
      createdAt: '2025-01-10T12:00:00.000Z',
    },
    generateCurl: (
      apiKey,
      params,
      baseUrl,
    ) => `curl -X POST "${baseUrl}/programs" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${params.name || 'my-solana-program'}",
    "description": "${params.description || 'My awesome Solana program'}",
    "cluster": "${params.cluster || 'devnet'}"
  }'`,
    generateTypeScript: (
      apiKey,
      params,
      baseUrl,
    ) => `const response = await fetch('${baseUrl}/programs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '${params.name || 'my-solana-program'}',
    description: '${params.description || 'My awesome Solana program'}',
    cluster: '${params.cluster || 'devnet'}'
  })
});

const data = await response.json();
console.log(data);`,
  },

  {
    id: 'list-programs',
    method: 'GET',
    path: '/programs',
    category: 'Programs',
    title: 'List Programs',
    description: 'List all programs for the authenticated user',
    requiresAuth: true,
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of records to return (default: 50)',
        in: 'query',
        example: '10',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of records to skip (default: 0)',
        in: 'query',
        example: '0',
      },
    ],
    responseExample: [
      {
        id: 'prog_123',
        name: 'my-solana-program',
        description: 'My awesome Solana program',
        programAddress: '11111111111111111111111111111111',
        cluster: 'devnet',
        status: 'deployed',
        createdAt: '2025-01-10T12:00:00.000Z',
        deployedAt: '2025-01-10T12:05:00.000Z',
      },
    ],
    generateCurl: (
      apiKey,
      params,
      baseUrl,
    ) => `curl -X GET "${baseUrl}/programs?limit=${params.limit || 50}&offset=${params.offset || 0}" \\
  -H "Authorization: Bearer ${apiKey}"`,
    generateTypeScript: (
      apiKey,
      params,
      baseUrl,
    ) => `const response = await fetch('${baseUrl}/programs?limit=${params.limit || 50}&offset=${params.offset || 0}', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
  },
];

export function getEndpointsByCategory(): Record<string, ApiEndpoint[]> {
  return API_ENDPOINTS.reduce(
    (acc, endpoint) => {
      if (!acc[endpoint.category]) {
        acc[endpoint.category] = [];
      }
      acc[endpoint.category].push(endpoint);
      return acc;
    },
    {} as Record<string, ApiEndpoint[]>,
  );
}
