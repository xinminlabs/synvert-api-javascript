import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import Rollbar from 'rollbar';
import { syncSnippets, readSnippets, availableSnippets, snippetsHome } from "synvert/lib/command";
import type { Snippet } from "synvert/lib/types";

import { redisClient } from "./connection";
import {
  JAVASCRIPT_SNIPPETS,
  TYPESCRIPT_SNIPPETS,
  CSS_SNIPPETS,
  LESS_SNIPPETS,
  SASS_SNIPPETS,
  SCSS_SNIPPETS,
  JAVASCRIPT_SNIPPETS_ETAG,
  TYPESCRIPT_SNIPPETS_ETAG,
  CSS_SNIPPETS_ETAG,
  LESS_SNIPPETS_ETAG,
  SASS_SNIPPETS_ETAG,
  SCSS_SNIPPETS_ETAG,
} from "./constants";

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
  await client.set(JAVASCRIPT_SNIPPETS, JSON.stringify(camelToSnake(javascriptSnippets(snippets))));
  await client.set(TYPESCRIPT_SNIPPETS, JSON.stringify(camelToSnake(typescriptSnippets(snippets))));
  await client.set(CSS_SNIPPETS, JSON.stringify(camelToSnake(cssSnippets(snippets))));
  await client.set(LESS_SNIPPETS, JSON.stringify(camelToSnake(lessSnippets(snippets))));
  await client.set(SASS_SNIPPETS, JSON.stringify(camelToSnake(sassSnippets(snippets))));
  await client.set(SCSS_SNIPPETS, JSON.stringify(camelToSnake(scssSnippets(snippets))));
  await client.disconnect();
}

async function saveSnippetsEtag() {
  const client = redisClient();
  await client.connect();
  const javascriptEtag = crypto.createHash("md5").update(await client.get(JAVASCRIPT_SNIPPETS)).digest("hex");
  await client.set(JAVASCRIPT_SNIPPETS_ETAG, javascriptEtag);
  const typescriptEtag = crypto.createHash("md5").update(await client.get(TYPESCRIPT_SNIPPETS)).digest("hex");
  await client.set(TYPESCRIPT_SNIPPETS_ETAG, typescriptEtag);
  const cssEtag = crypto.createHash("md5").update(await client.get(CSS_SNIPPETS)).digest("hex");
  await client.set(CSS_SNIPPETS_ETAG, cssEtag);
  const lessEtag = crypto.createHash("md5").update(await client.get(LESS_SNIPPETS)).digest("hex");
  await client.set(LESS_SNIPPETS_ETAG, lessEtag);
  const sassEtag = crypto.createHash("md5").update(await client.get(SASS_SNIPPETS)).digest("hex");
  await client.set(SASS_SNIPPETS_ETAG, sassEtag);
  const scssEtag = crypto.createHash("md5").update(await client.get(SCSS_SNIPPETS)).digest("hex");
  await client.set(SCSS_SNIPPETS_ETAG, scssEtag);
  await client.disconnect();
}

function javascriptSnippets(snippets) {
  return snippets.filter(snippet => !["css", "less", "sass", "scss", "typescript"].includes(snippet.group));
}

function typescriptSnippets(snippets) {
  return snippets.filter(snippet => !["css", "less", "sass", "scss"].includes(snippet.group));
}

function cssSnippets(snippets) {
  return snippets.filter(snippet => snippet.group === "css");
}

function lessSnippets(snippets) {
  return snippets.filter(snippet => snippet.group === "less");
}

function sassSnippets(snippets) {
  return snippets.filter(snippet => snippet.group === "sass");
}

function scssSnippets(snippets) {
  return snippets.filter(snippet => snippet.group === "scss");
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
