import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import { syncSnippets, readSnippets, availableSnippets, snippetsHome } from "synvert/lib/command";
import type { Snippet } from "synvert/lib/types";

import { redisClient } from "./connection";
import { JAVASCRIPT_SNIPPETS, TYPESCRIPT_SNIPPETS, JAVASCRIPT_SNIPPETS_ETAG, TYPESCRIPT_SNIPPETS_ETAG } from "./constants";

let snippets: Snippet[] = [];

async function process() {
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
}

async function saveSnippets() {
  for (const snippet of snippets) {
    const filePath = path.join(snippetsHome(), "lib", `${snippet.group}/${snippet.name}.js`);
    snippet["source_code"] = await fs.readFile(filePath, "utf-8");
  }
  const client = redisClient();
  await client.connect();
  await client.set(JAVASCRIPT_SNIPPETS, JSON.stringify(javascriptSnippets(snippets)));
  await client.set(TYPESCRIPT_SNIPPETS, JSON.stringify(typescriptSnippets(snippets)));
  await client.disconnect();
}

async function saveSnippetsEtag() {
  const client = redisClient();
  await client.connect();
  const javascriptEtag = crypto.createHash("md5").update(JSON.stringify(javascriptSnippets(snippets))).digest("hex");
  await client.set(JAVASCRIPT_SNIPPETS_ETAG, javascriptEtag);
  const typescriptEtag = crypto.createHash("md5").update(JSON.stringify(typescriptSnippets(snippets))).digest("hex");
  await client.set(TYPESCRIPT_SNIPPETS_ETAG, typescriptEtag);
  await client.disconnect();
}

function javascriptSnippets(snippets) {
  return snippets.filter(snippet => snippet.group !== "typescript");
}

function typescriptSnippets(snippets) {
  return snippets;
}

(async () => {
  await process();
})();
