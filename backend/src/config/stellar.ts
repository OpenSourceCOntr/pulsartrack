import { Horizon, Networks } from '@stellar/stellar-sdk';

const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL =
  NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

const SOROBAN_RPC_URL =
  NETWORK === 'mainnet'
    ? 'https://mainnet.sorobanrpc.com'
    : 'https://soroban-testnet.stellar.org';

const NETWORK_PASSPHRASE =
  NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

export const stellarConfig = {
  network: NETWORK,
  horizonUrl: HORIZON_URL,
  sorobanRpcUrl: SOROBAN_RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE,
};

export function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(HORIZON_URL);
}

export const CONTRACT_IDS = {
  AD_REGISTRY: process.env.CONTRACT_AD_REGISTRY || '',
  CAMPAIGN_ORCHESTRATOR: process.env.CONTRACT_CAMPAIGN_ORCHESTRATOR || '',
  ESCROW_VAULT: process.env.CONTRACT_ESCROW_VAULT || '',
  FRAUD_PREVENTION: process.env.CONTRACT_FRAUD_PREVENTION || '',
  PAYMENT_PROCESSOR: process.env.CONTRACT_PAYMENT_PROCESSOR || '',
  GOVERNANCE_TOKEN: process.env.CONTRACT_GOVERNANCE_TOKEN || '',
  GOVERNANCE_DAO: process.env.CONTRACT_GOVERNANCE_DAO || '',
  PUBLISHER_VERIFICATION: process.env.CONTRACT_PUBLISHER_VERIFICATION || '',
  PUBLISHER_REPUTATION: process.env.CONTRACT_PUBLISHER_REPUTATION || '',
  ANALYTICS_AGGREGATOR: process.env.CONTRACT_ANALYTICS_AGGREGATOR || '',
  AUCTION_ENGINE: process.env.CONTRACT_AUCTION_ENGINE || '',
  SUBSCRIPTION_MANAGER: process.env.CONTRACT_SUBSCRIPTION_MANAGER || '',
  PRIVACY_LAYER: process.env.CONTRACT_PRIVACY_LAYER || '',
  TARGETING_ENGINE: process.env.CONTRACT_TARGETING_ENGINE || '',
  DISPUTE_RESOLUTION: process.env.CONTRACT_DISPUTE_RESOLUTION || '',
  REVENUE_SETTLEMENT: process.env.CONTRACT_REVENUE_SETTLEMENT || '',
  REWARDS_DISTRIBUTOR: process.env.CONTRACT_REWARDS_DISTRIBUTOR || '',
};
