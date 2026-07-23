import { Injectable, Logger } from '@nestjs/common';
import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  Contract,
  BASE_FEE,
  xdr,
} from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: Horizon.Server;
  private readonly networkPassphrase: string;

  constructor() {
    const isTestnet = process.env.STELLAR_NETWORK !== 'public';
    const horizonUrl = isTestnet
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';

    this.server = new Horizon.Server(horizonUrl);
    this.networkPassphrase = isTestnet ? Networks.TESTNET : Networks.PUBLIC;
  }

  getServer(): Horizon.Server {
    return this.server;
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  async getAccountBalance(address: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(address);
      const xlm = account.balances.find((b) => b.asset_type === 'native');
      return xlm?.balance || '0';
    } catch {
      return '0';
    }
  }

  async invokeContract(
    contractId: string,
    method: string,
    sourceSecret: string,
    args: xdr.ScVal[] = [],
  ): Promise<any> {
    const sourceKeypair = Keypair.fromSecret(sourceSecret);
    const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());

    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    const result = await this.server.submitTransaction(tx);

    if (result.successful) {
      this.logger.log(`Contract call ${method} on ${contractId} succeeded: ${result.hash}`);
      return result.hash;
    }

    throw new Error(`Contract call failed: ${result.hash}`);
  }
}
