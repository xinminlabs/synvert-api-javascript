import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import Rollbar from 'rollbar';
import { syncSnippets, readSnippets, availableSnippets, snippetsHome } from "synvert/lib/command";
import type { Snippet } from "synvert/lib/types";

import { redisClient } from "./connection";
import { JAVASCRIPT_SNIPPETS, TYPESCRIPT_SNIPPETS, JAVASCRIPT_SNIPPETS_ETAG, TYPESCRIPT_SNIPPETS_ETAG } from "./constants";

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

let snippets: Snippet[] = [];

async function start() {
  try {
    console.log("=====syncing javascript snippets=====");
    await syncSnippets();

    console.log("=====reading javascript snippets=====");
    await readSnippets();
    snippets = await availableSnippets();

    console.log("=====saving javascript snippets to db=====");
    await saveSnippets();

    console.log("=====set javascript snippets etag=====");
    await saveSnippetsEtag();

    console.log("=====done=====");
  } catch (e) {
    rollbar.error(e);
  }
}

async function saveSnippets() {
  for (const snippet of snippets) {
    const filePath = path.join(snippetsHome(), "lib", `${snippet.group}/${snippet.name}.js`);
    snippet["source_code"] = await fs.readFile(filePath, "utf-8");
  }
  const client = redisClient();
  await client.connect();
  console.log(JSON.stringify(camelToSnake(javascriptSnippets(snippets))));
  await client.set(JAVASCRIPT_SNIPPETS, JSON.stringify(camelToSnake(javascriptSnippets(snippets))));
  await client.set(TYPESCRIPT_SNIPPETS, JSON.stringify(camelToSnake(typescriptSnippets(snippets))));
  await client.disconnect();
}

async function saveSnippetsEtag() {
  const client = redisClient();
  await client.connect();
  const javascriptEtag = crypto.createHash("md5").update(await client.get(JAVASCRIPT_SNIPPETS)).digest("hex");
  await client.set(JAVASCRIPT_SNIPPETS_ETAG, javascriptEtag);
  const typescriptEtag = crypto.createHash("md5").update(await client.get(TYPESCRIPT_SNIPPETS)).digest("hex");
  await client.set(TYPESCRIPT_SNIPPETS_ETAG, typescriptEtag);
  await client.disconnect();
}

function javascriptSnippets(snippets) {
  return snippets.filter(snippet => snippet.group !== "typescript");
}

function typescriptSnippets(snippets) {
  return snippets;
}

function camelToSnake(obj: any): any {
  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => camelToSnake(item));
  }

  const snakeObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeObj[snakeKey] = camelToSnake(obj[key]);
    }
  }

  return snakeObj;
}

(async () => {
  await start();
})();
