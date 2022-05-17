import {
    Borsh,
    Account,
    ERROR_INVALID_ACCOUNT_DATA,
    ERROR_INVALID_OWNER,
    AnyPublicKey,
  } from '../core';
  import { AccountInfo, PublicKey } from '@solana/web3.js';
  import BN from 'bn.js';
  import { Edition } from './Edition';
  import { MetadataKey, MetadataProgram } from './MetadataProgram';
  import { Buffer } from 'buffer';
import { METADATA_PROGRAM_ID } from '../../../vars';
  
  type Args = { key: MetadataKey; ledger: number[] };
  export class EditionMarkerData extends Borsh.Data<Args> {
    static readonly SCHEMA = EditionMarkerData.struct([
      ['key', 'u8'],
      ['ledger', [31]],
    ]);
  
    key: MetadataKey;
    ledger: number[];
  
    constructor(args: Args) {
      super(args);
      this.key = MetadataKey.EditionMarker;
    }
  
    editionTaken(edition: number) {
      const editionOffset = edition % EditionMarker.DATA_SIZE;
      const indexOffset = Math.floor(editionOffset / 8);
  
      if (indexOffset > 30) {
        throw Error('Bad index for edition');
      }
  
      const positionInBitsetFromRight = 7 - (editionOffset % 8);
      const mask = Math.pow(2, positionInBitsetFromRight);
      const appliedMask = this.ledger[indexOffset] & mask;
  
      return appliedMask != 0;
    }
  }
  
  export class EditionMarker extends Account<EditionMarkerData> {
    static readonly DATA_SIZE = 248;
  
    constructor(key: AnyPublicKey, info: AccountInfo<Buffer>) {
      super(key, info);
  
      if (!this.assertOwner(METADATA_PROGRAM_ID)) {
        throw ERROR_INVALID_OWNER();
      }
  
      if (!EditionMarker.isCompatible(this.info.data)) {
        throw ERROR_INVALID_ACCOUNT_DATA();
      }
  
      this.data = EditionMarkerData.deserialize(this.info.data);
    }
  
    static async getPDA(mint: AnyPublicKey, edition: BN) {
      const editionNumber = Math.floor(edition.toNumber() / 248);
  
      return MetadataProgram.findProgramAddress([
        Buffer.from(MetadataProgram.PREFIX),
        METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(mint).toBuffer(),
        Buffer.from(Edition.EDITION_PREFIX),
        Buffer.from(editionNumber.toString()),
      ]);
    }
  
    static override isCompatible(data: Buffer) {
      return data[0] === MetadataKey.EditionMarker;
    }
  }