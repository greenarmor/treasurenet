import * as SecureStore from 'expo-secure-store';
import { Keypair, StrKey, Horizon, Networks, TransactionBuilder, Operation, Asset, BASE_FEE } from '@stellar/stellar-sdk';

const STORE_KEY_SECRET = 'treasurenet_secret_key';
const STORE_KEY_PUBLIC = 'treasurenet_public_key';

export interface MobileWallet {
  publicKey: string;
  secretKey: string;
}

export interface TxResult {
  hash: string;
  success: boolean;
  error?: string;
  explorerUrl?: string;
}

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// ─── Key Management ──────────────────────────────────────────

export async function generateWallet(): Promise<MobileWallet> {
  const keypair = Keypair.random();
  await SecureStore.setItemAsync(STORE_KEY_SECRET, keypair.secret());
  await SecureStore.setItemAsync(STORE_KEY_PUBLIC, keypair.publicKey());
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

export async function getWallet(): Promise<MobileWallet | null> {
  const publicKey = await SecureStore.getItemAsync(STORE_KEY_PUBLIC);
  const secretKey = await SecureStore.getItemAsync(STORE_KEY_SECRET);
  if (!publicKey || !secretKey) return null;
  return { publicKey, secretKey };
}

export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY_SECRET);
  await SecureStore.deleteItemAsync(STORE_KEY_PUBLIC);
}

// ─── Balance ─────────────────────────────────────────────────

export async function fetchBalance(publicKey: string): Promise<string> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    const xlm = account.balances.find((b: any) => b.asset_type === 'native');
    return xlm?.balance || '0';
  } catch {
    return '0';
  }
}

// ─── Transaction ─────────────────────────────────────────────

export async function sendPayment(
  secretKey: string,
  publicKey: string,
  destination: string,
  amount: string,
): Promise<TxResult> {
  try {
    if (!StrKey.isValidEd25519PublicKey(destination)) {
      throw new Error('Invalid destination address');
    }

    const server = new Horizon.Server(HORIZON_URL);
    const sourceAccount = await server.loadAccount(publicKey);
    const keypair = Keypair.fromSecret(secretKey);

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount,
        }),
      )
      .setTimeout(180)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);

    return {
      hash: result.hash,
      success: result.successful,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
    };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.extras?.result_codes?.transaction ||
      err?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
      err?.message || 'Transaction failed';

    return {
      hash: err?.response?.data?.hash || '',
      success: false,
      error: errorMsg,
      explorerUrl: err?.response?.data?.hash
        ? `https://stellar.expert/explorer/testnet/tx/${err.response.data.hash}`
        : undefined,
    };
  }
}

// ─── Auth Signing ────────────────────────────────────────────

export async function signMessage(secretKey: string, message: string): Promise<string> {
  const keypair = Keypair.fromSecret(secretKey);
  const signature = keypair.sign(Buffer.from(message));
  return Buffer.from(signature).toString('base64');
}
