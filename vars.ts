import { PublicKey, Connection } from "@solana/web3.js";
import { programs } from "@fluidchains/metaplex-js";
import dotenv from "dotenv";

const dotEnvVars = dotenv.config().parsed;

const { metaplex: { Store } } = programs;

const STORE_OWNER = new PublicKey((dotEnvVars as any).STORE_OWNER);

export const STORE_ID = Store.getPDA(STORE_OWNER);

export const connection = new Connection((dotEnvVars as any).RPC);