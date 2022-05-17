import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  AnyPublicKey,
  StringPublicKey,
  Account,
  ERROR_INVALID_ACCOUNT_DATA,
  ERROR_INVALID_OWNER,
  TupleNumericType,
  Borsh,
} from '../core';
import { MetaplexKey, MetaplexProgram } from './MetaplexProgram';
import { Buffer } from 'buffer';
import { METAPLEX_ID } from '../../../vars';

export enum WinningConfigType {
  /// You may be selling your one-of-a-kind NFT for the first time, but not it's accompanying Metadata,
  /// of which you would like to retain ownership. You get 100% of the payment the first sale, then
  /// royalties forever after.
  ///
  /// You may be re-selling something like a Limited/Open Edition print from another auction,
  /// a master edition record token by itself (Without accompanying metadata/printing ownership), etc.
  /// This means artists will get royalty fees according to the top level royalty % on the metadata
  /// split according to their percentages of contribution.
  ///
  /// No metadata ownership is transferred in this instruction, which means while you may be transferring
  /// the token for a limited/open edition away, you would still be (nominally) the owner of the limited edition
  /// metadata, though it confers no rights or privileges of any kind.
  TokenOnlyTransfer,
  /// Means you are auctioning off the master edition record and it's metadata ownership as well as the
  /// token itself. The other person will be able to mint authorization tokens and make changes to the
  /// artwork.
  FullRightsTransfer,
  /// Means you are using authorization tokens to print off editions during the auction using
  /// from a MasterEditionV1
  PrintingV1,
  /// Means you are using the MasterEditionV2 to print off editions
  PrintingV2,
  /// Means you are using a MasterEditionV2 as a participation prize.
  Participation,
}

export enum WinningConstraint {
  NoParticipationPrize = 0,
  ParticipationPrizeGiven = 1,
}

export enum NonWinningConstraint {
  NoParticipationPrize = 0,
  GivenForFixedPrice = 1,
  GivenForBidPrice = 2,
}

export interface AmountRangeArgs {
  amount: BN;
  length: BN;
}

export class AmountRange extends Borsh.Data<AmountRangeArgs> {
  static readonly SCHEMA = this.struct([
    ['amount', 'u64'],
    ['length', 'u64'],
  ]);

  amount: BN;
  length: BN;
}

export interface ParticipationConfigV2Args {
  winnerConstraint: WinningConstraint;
  nonWinningConstraint: NonWinningConstraint;
  fixedPrice: BN | null;
}

export class ParticipationConfigV2 extends Borsh.Data<ParticipationConfigV2Args> {
  static readonly SCHEMA = this.struct([
    ['winnerConstraint', 'u8'],
    ['nonWinningConstraint', 'u8'],
    ['fixedPrice', { kind: 'option', type: 'u64' }],
  ]);

  winnerConstraint: WinningConstraint;
  nonWinningConstraint: NonWinningConstraint;
  fixedPrice: BN | null;
}

export interface ParticipationStateV2Args {
  collectedToAcceptPayment: BN;
}

export class ParticipationStateV2 extends Borsh.Data<ParticipationStateV2Args> {
  static readonly SCHEMA = this.struct([['collectedToAcceptPayment', 'u64']]);

  collectedToAcceptPayment: BN;
}

export interface SafetyDepositConfigDataArgs {
  auctionManager: StringPublicKey;
  order: BN;
  winningConfigType: WinningConfigType;
  amountType: TupleNumericType;
  lengthType: TupleNumericType;
  amountRanges: AmountRange[];
  participationConfig: ParticipationConfigV2 | null;
  participationState: ParticipationStateV2 | null;
}

export class SafetyDepositConfigData extends Borsh.Data<SafetyDepositConfigDataArgs> {
  static readonly SCHEMA = new Map([
    ...ParticipationConfigV2.SCHEMA,
    ...ParticipationStateV2.SCHEMA,
    ...AmountRange.SCHEMA,
    ...this.struct([
      ['key', 'u8'],
      ['auctionManager', 'pubkeyAsString'],
      ['order', 'u64'],
      ['winningConfigType', 'u8'],
      ['amountType', 'u8'],
      ['lengthType', 'u8'],
      ['amountRanges', [AmountRange]],
      ['participationConfig', { kind: 'option', type: ParticipationConfigV2 }],
      ['participationState', { kind: 'option', type: ParticipationStateV2 }],
    ]),
  ]);

  key: MetaplexKey = MetaplexKey.SafetyDepositConfigV1;
  auctionManager: StringPublicKey;
  order: BN;
  winningConfigType: WinningConfigType;
  amountType: TupleNumericType;
  lengthType: TupleNumericType;
  amountRanges: AmountRange[];
  participationConfig: ParticipationConfigV2 | null;
  participationState: ParticipationStateV2 | null;

  constructor(args: SafetyDepositConfigDataArgs) {
    super(args);
    this.key = MetaplexKey.SafetyDepositConfigV1;
  }
}

export class SafetyDepositConfig extends Account<SafetyDepositConfigData> {
  constructor(pubkey: AnyPublicKey, info: AccountInfo<Buffer>) {
    super(pubkey, info);

    if (!this.assertOwner(METAPLEX_ID)) {
      throw ERROR_INVALID_OWNER();
    }

    if (!SafetyDepositConfig.isCompatible(this.info.data)) {
      throw ERROR_INVALID_ACCOUNT_DATA();
    }

    this.data = SafetyDepositConfigData.deserialize(this.info.data);
  }

  static override isCompatible(data: Buffer) {
    return data[0] === MetaplexKey.SafetyDepositConfigV1;
  }

  static async getPDA(auctionManager: AnyPublicKey, safetyDeposit: AnyPublicKey) {
    return MetaplexProgram.findProgramAddress([
      Buffer.from(MetaplexProgram.PREFIX),
      METAPLEX_ID.toBuffer(),
      new PublicKey(auctionManager).toBuffer(),
      new PublicKey(safetyDeposit).toBuffer(),
    ]);
  }
}