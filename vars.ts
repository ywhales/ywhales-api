import { PublicKey, Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { Store } from "./sdk/programs/plex/Store";

const dotEnvVars = dotenv.config().parsed;


export const STORE_OWNER = new PublicKey((dotEnvVars as any).STORE_OWNER);

export const STORE_ID = Store.getPDA(STORE_OWNER);

export const connection = new Connection((dotEnvVars as any).RPC);


export const METADATA_PROGRAM_ID = new PublicKey(
'ymejMoHH1bsxXCjKjjsVoCZGkq6bpmcxgTHYfLKRoHq');

export const VAULT_ID = new PublicKey(
'yvaUJxtAiuphyL7JiVMMdY7uTJe1ekb4LmHXtBv5SFd');

export const AUCTION_ID = new PublicKey(
'yauNkf2KVyLp9YBQb4mNeiwFCCWu1Vei9Tx3EsgCESG');

export const METAPLEX_ID = new PublicKey(
'yp1ZrQ2ghLMDNdaGdYLiwi8QRFyws2tAHNa7JG2VuTq') ;

    