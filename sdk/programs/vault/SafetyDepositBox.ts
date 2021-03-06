import { AccountInfo, PublicKey } from '@solana/web3.js';
import { VaultKey, VaultProgram } from './VaultProgram';
import { Buffer } from 'buffer';
import {
  Account,
  AnyPublicKey,
  Borsh,
  ERROR_INVALID_ACCOUNT_DATA,
  ERROR_INVALID_OWNER,
  StringPublicKey,
} from '../core'
import { VAULT_ID } from '../../../vars';

type Args = {
  vault: StringPublicKey;
  tokenMint: StringPublicKey;
  store: StringPublicKey;
  order: number;
};
export class SafetyDepositBoxData extends Borsh.Data<Args> {
  static readonly SCHEMA = this.struct([
    ['key', 'u8'],
    ['vault', 'pubkeyAsString'],
    ['tokenMint', 'pubkeyAsString'],
    ['store', 'pubkeyAsString'],
    ['order', 'u8'],
  ]);

  /// Each token type in a vault has it's own box that contains it's mint and a look-back
  key: VaultKey;
  /// VaultKey pointing to the parent vault
  vault: StringPublicKey;
  /// This particular token's mint
  tokenMint: StringPublicKey;
  /// Account that stores the tokens under management
  store: StringPublicKey;
  /// the order in the array of registries
  order: number;

  constructor(args: Args) {
    super(args);
    this.key = VaultKey.SafetyDepositBoxV1;
  }
}

export class SafetyDepositBox extends Account<SafetyDepositBoxData> {
  constructor(key: AnyPublicKey, info: AccountInfo<Buffer>) {
    super(key, info);

    if (!this.assertOwner(VAULT_ID)) {
      throw ERROR_INVALID_OWNER();
    }

    if (!SafetyDepositBox.isCompatible(this.info.data)) {
      throw ERROR_INVALID_ACCOUNT_DATA();
    }

    this.data = SafetyDepositBoxData.deserialize(this.info.data);
  }

  static async getPDA(vault: AnyPublicKey, mint: AnyPublicKey) {
    return VaultProgram.findProgramAddress([
      Buffer.from(VaultProgram.PREFIX),
      new PublicKey(vault).toBuffer(),
      new PublicKey(mint).toBuffer(),
    ]);
  }

  static override isCompatible(data: Buffer) {
    return data[0] === VaultKey.SafetyDepositBoxV1;
  }
}