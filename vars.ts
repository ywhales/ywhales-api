import { PublicKey, Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { Store } from "./sdk/programs/plex/Store";

const dotEnvVars = dotenv.config().parsed;


export const STORE_OWNER = new PublicKey((dotEnvVars as any).STORE_OWNER);

export const STORE_ID = Store.getPDA(STORE_OWNER);

export const connection = new Connection((dotEnvVars as any).RPC);

//Keep the metadata always on metaXXXXX
export const METADATA_PROGRAM_ID = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    
export const VAULT_ID = new PublicKey(
    '4CJLCFj8dhHmAC3TJizaN2BqkzW6hDeviZwH9qsSBjwH');
    
export const AUCTION_ID = new PublicKey(
    '2bhX9H5dAYaNqCHWVuJphto8eAwAxSQVRzvT5KJDs6eW');
    
export const METAPLEX_ID = new PublicKey(
    'Fr6ufqFxV3AuYEPYDvRjR2ghaCg6RyzvU3k9pC5z6x94') ;
    
    