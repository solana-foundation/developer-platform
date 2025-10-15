/**
 * Centralized environment configuration for the web application.
 * All external URLs and API endpoints should be imported from here.
 */

/**
 * Backend API base URL
 * Used for all API calls to the NestJS backend
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Solana Explorer base URL
 * Used for linking to Solana Explorer for addresses and transactions
 */
export const SOLANA_EXPLORER_URL =
  process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || 'https://explorer.solana.com';

/**
 * Transaction Explorer base URL
 * Used for linking to transaction details (Solscan)
 */
export const TX_EXPLORER_URL =
  process.env.NEXT_PUBLIC_TX_EXPLORER_URL || 'https://solscan.io';
