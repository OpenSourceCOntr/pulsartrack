/**
 * Error handling for Stellar/Soroban interactions
 */

export enum ErrorCode {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  TX_FAILED = 'TX_FAILED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  UNKNOWN = 'UNKNOWN',
}

export interface PulsarError {
  code: ErrorCode;
  message: string;
  originalError?: unknown;
}

export function createPulsarError(
  code: ErrorCode,
  message: string,
  originalError?: unknown
): PulsarError {
  return { code, message, originalError };
}

export function parseStellarError(error: unknown): PulsarError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('not found') || msg.includes('freighter')) {
      return createPulsarError(ErrorCode.WALLET_NOT_FOUND, error.message, error);
    }

    if (msg.includes('rejected') || msg.includes('cancel')) {
      return createPulsarError(ErrorCode.USER_REJECTED, 'User rejected the transaction', error);
    }

    if (msg.includes('network') || msg.includes('passphrase')) {
      return createPulsarError(
        ErrorCode.NETWORK_MISMATCH,
        'Wrong network. Please switch to the correct Stellar network in Freighter.',
        error
      );
    }

    if (msg.includes('insufficient') || msg.includes('balance')) {
      return createPulsarError(
        ErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient XLM balance for this transaction.',
        error
      );
    }

    if (msg.includes('simulation')) {
      return createPulsarError(ErrorCode.SIMULATION_FAILED, error.message, error);
    }

    if (msg.includes('failed') || msg.includes('error')) {
      return createPulsarError(ErrorCode.CONTRACT_ERROR, error.message, error);
    }
  }

  return createPulsarError(ErrorCode.UNKNOWN, 'An unexpected error occurred.', error);
}

export function getErrorMessage(error: PulsarError): string {
  switch (error.code) {
    case ErrorCode.WALLET_NOT_FOUND:
      return 'Freighter wallet not found. Please install the Freighter browser extension.';
    case ErrorCode.USER_REJECTED:
      return 'Transaction was rejected by the user.';
    case ErrorCode.NETWORK_MISMATCH:
      return 'Network mismatch. Please switch to the correct Stellar network in Freighter.';
    case ErrorCode.INSUFFICIENT_FUNDS:
      return 'Insufficient XLM balance. Please fund your account on the Stellar testnet.';
    case ErrorCode.SIMULATION_FAILED:
      return `Contract simulation failed: ${error.message}`;
    case ErrorCode.CONTRACT_ERROR:
      return `Contract error: ${error.message}`;
    case ErrorCode.TX_FAILED:
      return 'Transaction failed on-chain.';
    case ErrorCode.NOT_CONNECTED:
      return 'Wallet not connected. Please connect your Freighter wallet.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
