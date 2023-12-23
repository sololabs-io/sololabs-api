export interface TransactionStatus {
  status: Status;
  signature?: string;
  blockhash?: string;
  triesCount?: number;
  createdAt?: Date;
}

export enum Status {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface TransactionStatusResponse {
  id: string;
  signature?: string;
  status?: Status;
}

export enum Environment {
  PRODUCTION = 'PRODUCTION',
  DEVELOPMENT = 'DEVELOPMENT'
}

export interface WalletModel {
  publicKey: string; 
  privateKey: number[];
}
