import { PublicKey } from "@solana/web3.js";
import { STORE_ID, connection, STORE_OWNER, VAULT_ID, AUCTION_ID, METADATA_PROGRAM_ID, METAPLEX_ID } from "./vars";
import dotenv from "dotenv";
import * as fs from 'fs';
import { AuctionManager } from "./sdk/programs/plex/AuctionManager";
import { Auction, PriceFloorType } from "./sdk/programs/auction/Auction";
import { Vault } from "./sdk/programs/vault/Vault";
import { Metadata } from "./sdk/programs/metadata/Metadata";
import { Store } from "./sdk/programs/plex/Store";

const https = require('https');
const cors = require('cors');
const express = require('express');
const logger = require('./utils/logger');
const app = express();

const dotEnvVars = dotenv.config().parsed;

// const {
//   metaplex: { AuctionManager },
//   metadata: { Metadata },
//   vault: { Vault }
// } = programs;

app.use(cors());

app.listen(Number((dotEnvVars as any).PORT), async () => {
  var dir = './logs';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  logger.info("Connected to port " + Number((dotEnvVars as any).PORT));
  logger.info("Store " + STORE_OWNER.toBase58());
  logger.info("Vault ID: " + VAULT_ID.toBase58());
  logger.info("Auction ID: " + AUCTION_ID.toBase58());
  logger.info("Metadata ID: " + METADATA_PROGRAM_ID.toBase58());
  logger.info("Metaplex ID: " + METAPLEX_ID.toBase58());
  const whales = await checkWhalesFile();
  updateWhales(whales);
})

app.get('/whales', async (req: any, res: any) => {
  const whales = await checkWhalesFile();
  logger.info("Whales: " + whales);
  res.send(whales);
})

async function updateWhales(whales: any) {
  const date = dateParser();
  if (whales !== null) {
    logger.info("whale's not empty");
    lookForUpdates(whales, date);
    setInterval(() => lookForUpdates(whales, date), 60000);
  }
  if (whales === null) {
    logger.info("whale's empty, creating new one...");
    lookForUpdates(whales, date);
    setInterval(() => lookForUpdates(whales, date), 60000);
  }
}

async function lookForUpdates(whales: any, date: string) {
  try {
  const storeItems = await loadAccounts();
  // Update data
  if (whales !== null && storeItems!== undefined) {
    if (whales.validWhales !== storeItems.length) {
      const writableContent = JSON.stringify(
        {
          whales: storeItems,
          validWhales: storeItems.length,
        }
      );

      // Check folder
      var dir = './ywhales_history';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      fs.writeFile(`./ywhales_history/ywhales_${date}.json`, JSON.stringify(whales), (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
        // success case, the file was saved
        logger.info('New history file saved!');
      });
      fs.writeFile('./ywhales.json', writableContent, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
        // success case, the file was saved
        logger.info("Whale's registry update saved succesfully!");
      });
    } else {
      logger.info("No new whales found");
    }
  }
  if (whales === null && storeItems !== undefined){
    const writableContent = JSON.stringify(
      {
        whales: storeItems,
        validWhales: storeItems.length,
      }
    );
    fs.writeFile('./ywhales.json', writableContent, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      logger.info("New Whale's registry saved succesfully!");
    });
  }
  }
  catch(error){
    logger.error(error)
  }
}

async function checkWhalesFile() {
  try {
    const file = JSON.parse(fs.readFileSync('./ywhales.json').toString());
    return file;
  } catch (error) {
    logger.error("Whale's registry file not found!");
    return null
  }
}

function dateParser() {
  var date = new Date();

  var year = date.getFullYear().toString();
  var month = checkLessThanTen(date.getMonth() + 1).toString();
  var day = checkLessThanTen(date.getDate()).toString();
  var hours = checkLessThanTen(date.getHours()).toString();
  var minutes = checkLessThanTen(date.getMinutes()).toString();
  var seconds = checkLessThanTen(date.getSeconds()).toString();

  // yyyymmdd-HHmmSS
  return (year+month+day+"-"+hours+minutes+seconds);
}

function checkLessThanTen(timeFormat: number) {
  if (timeFormat < 10) {
    return "0" + timeFormat;
  }
  return timeFormat;
}

async function loadAccounts() {

  try {
  let storeItems: {metadata: Metadata, price: number, auction: Auction}[] = [];
  
  const store = await Store.getPDA(STORE_OWNER);

  const auctionManagers = await AuctionManager.findMany(connection, {
    store: store,
  });

  for (const auction of auctionManagers) {
    const auctionData = await auction.getAuction(connection);
    const priceFloor = auctionData.data.priceFloor.type === PriceFloorType.Minimum
      ? auctionData.data.priceFloor.minPrice?.toNumber() || 0
      : 0;

    // Get Auction extended data(instansSalePrice, totalUncancelledBids, tickSize...)
    const vaultData = await Vault.load(connection, auction.data.vault);

    // Get safety deposit boxes
    const safetyDepositBoxes = await vaultData.getSafetyDepositBoxes(connection);

    // Accept auctions that have a started/ended state, and omit the ones that have a vault state as inactive or deactivatedx
    if (auctionData.data.state !== 0 && (vaultData.data.state !== 0 && vaultData.data.state !== 3) && safetyDepositBoxes !== undefined) {
      const findByMint = await Metadata.findByMint(connection, new PublicKey(safetyDepositBoxes[0].data.tokenMint));
      storeItems.push({ metadata: findByMint, price: priceFloor, auction: auctionData });
    }
  }

  return storeItems;
  }
  catch(error){
    logger.error(error)
  }

};
