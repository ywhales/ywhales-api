import { PublicKey } from "@solana/web3.js";
import { STORE_ID, connection } from "./vars";
import { programs } from '@fluidchains/metaplex-js';
import dotenv from "dotenv";
import * as fs from 'fs';

const cors = require('cors');
const express = require('express');
const app = express();

const dotEnvVars = dotenv.config().parsed;

const {
  metaplex: { AuctionManager },
  metadata: { Metadata },
  vault: { Vault }
} = programs;

app.use(cors());

app.listen(Number((dotEnvVars as any).PORT), async () => {
  console.log("Connected to port " + Number((dotEnvVars as any).PORT));
  const whales = await checkWhalesFile();
  updateWhales(whales);
})

app.get('/whales', async (req: any, res: any) => {
  const whales = await checkWhalesFile();
  res.send(whales);
})

async function updateWhales(whales: any) {
  const date = dateParser();
  if (whales !== null) {
    console.log("whale's not empty")
    lookForUpdates(whales, date);
    setInterval(() => lookForUpdates(whales, date), 300000);
  }
  if (whales === null) {
    console.log("whale's empty, creating new one...")
    lookForUpdates(whales, date);
    setInterval(() => lookForUpdates(whales, date), 300000);
  }
}

async function lookForUpdates(whales: any, date: string) {
  const storeItems = await loadAccounts();
  // Update data
  if (whales !== null) {
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
        console.log('New history file saved!');
      });
      fs.writeFile('./ywhales.json', writableContent, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
        // success case, the file was saved
        console.log('Changes saved!');
      });
    } else {
      console.log("No new whales found")
    }
  } else {
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
      console.log('Changes saved!');
    });
  }
}

async function checkWhalesFile() {
  try {
    const file = JSON.parse(fs.readFileSync('./ywhales.json').toString());
    return file;
  } catch (error) {
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

  let storeItems = [];
  
  const store = new PublicKey((await STORE_ID));

  const auctionManagers = await AuctionManager.findMany(connection, {
    store: store,
  });

  for (const auction of auctionManagers) {
    const auctionData = await auction.getAuction(connection);
    const priceFloor = auctionData.data.priceFloor.type === programs.auction.PriceFloorType.Minimum
      ? auctionData.data.priceFloor.minPrice?.toNumber() || 0
      : 0;

    // Get Auction extended data(instansSalePrice, totalUncancelledBids, tickSize...)
    const vaultData = await Vault.load(connection, auction.data.vault);

    // Get safety deposit boxes
    const safetyDepositBoxes = await vaultData.getSafetyDepositBoxes(connection);

    // Accept only auctions that have a started state, and omit the ones that have a vault state as inactive or deactivated
    if (auctionData.data.state === 1 && (vaultData.data.state !== 0 && vaultData.data.state !== 3) && safetyDepositBoxes !== undefined) {
      const findByMint = await Metadata.findByMint(connection, new PublicKey(safetyDepositBoxes[0].data.tokenMint));
      storeItems.push({ findByMint, price: priceFloor, auction: auctionData });
    }
  }

  return storeItems;

};