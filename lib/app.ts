import { createClient } from 'redis';
import express, { Express, Request, Response, NextFunction } from 'express';
import Rollbar from 'rollbar';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { generateAst, generateSnippet, parseSynvertSnippet, querySnippets, parseNql, mutateCode, getSnippets } from './api';
import { parseCode } from "./magic/utils";

const port = process.env.PORT || 4000;
const app: Express = express();
const jsonParser = bodyParser.json();
app.set('etag', false);
app.use(cors())
app.use(morgan('combined'))

const ONE_DAY = 60 * 60 * 24;
const SYNVERT_JAVASCRIPT_SNIPPETS_ETAG = "synvert-javascript-snippets-etag";
const ALL_JAVASCRIPT_SNIPPETS = "all_javascript_snippets"
const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const validateInputsOutputs = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.inputs || !Array.isArray(req.body.inputs) || req.body.inputs.length === 0) {
    return res.status(400).json({ error: "Inputs are invalid." });
  }
  if (!req.body.outputs || !Array.isArray(req.body.outputs)) {
    return res.status(400).json({ error: "Outputs are invalid." });
  }
  if (req.body.outputs.length > 0 && req.body.inputs.length !== req.body.outputs.length) {
    return res.status(400).json({ error: "Inputs size is not equal to outputs size." });
  }
  try {
    if (req.body.inputs.some(input => typeof parseCode(req.body.extension, input) === "undefined")) {
      return res.status(400).json({ error: "Inputs are invalid." });
    }
  } catch (e) {
    return res.status(400).json({ error: "Inputs are invalid." });
  }
  try {
    if (req.body.outputs.some(output => typeof parseCode(req.body.extension, output) === "undefined")) {
      return res.status(400).json({ error: "Outputs are invalid." });
    }
  } catch (e) {
    return res.status(400).json({ error: "Outputs are invalid." });
  }
  next();
}

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Synvert!');
});

app.post('/generate-ast', jsonParser, (req: Request, res: Response) => {
  const node = generateAst(req.body.extension, req.body.code);
  res.json({ node });
});

app.post('/parse-synvert-snippet', jsonParser, (req: Request, res: Response) => {
  const output = parseSynvertSnippet(req.body.extension, req.body.code, req.body.snippet);
  res.json({ output });
});

app.post('/generate-snippet', jsonParser, validateInputsOutputs, (req: Request, res: Response) => {
  const snippet = generateSnippet(req.body.extension, req.body.inputs, req.body.outputs, req.body.nql_or_rules);
  if (snippet) {
    res.json({ snippet });
  } else {
    res.status(400).json({ error: 'Failed to generate the snippet!' });
  }
});

app.get('/snippets', async (req: Request, res: Response) => {
  const clientEtag = req.get('If-None-Match');
  const serverEtag = await client.get(SYNVERT_JAVASCRIPT_SNIPPETS_ETAG);
  if (clientEtag === serverEtag) {
    res.status(304).end();
    return
  }

  res.set("ETag", serverEtag);
  res.set('Content-Type', 'application/json');
  let response = await client.get(ALL_JAVASCRIPT_SNIPPETS);
  if (!response) {
    const snippets = await getSnippets();
    response = JSON.stringify({ snippets });
    await client.set(ALL_JAVASCRIPT_SNIPPETS, response);
    await client.expire(ALL_JAVASCRIPT_SNIPPETS, ONE_DAY);
  }
  res.send(response);
});

app.post('/query-snippets', jsonParser, async (req: Request, res: Response) => {
  const snippets = await querySnippets(req.body.query);
  res.json({ snippets });
});

app.get('/check-versions', async (req: Request, res: Response) => {
  const versions = await client.hGetAll("javascript_versions");
  let synvertVersion = versions['synvert_version'];
  let synvertCoreVersion = versions['synvert_core_version'];
  if (!synvertVersion || !synvertCoreVersion) {
    const synvertResponse = await fetch('https://registry.npmjs.org/synvert/latest');
    const synvertJSON = await synvertResponse.json();
    synvertVersion = synvertJSON['version'];
    const synvertCoreResponse = await fetch('https://registry.npmjs.org/synvert-core/latest');
    const synvertCoreJSON = await synvertCoreResponse.json();
    synvertCoreVersion = synvertCoreJSON['version'];
    client.hSet('javascript_versions', { synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
    client.expire('javascript_versions', ONE_DAY);
  }
  res.json({ synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
});

/*******************
 * node-playground *
 *******************/

app.post("/parse-nql", jsonParser, (req: Request, res: Response) => {
  const ranges = parseNql(req.body.extension, req.body.nql, req.body.code);
  res.json({ ranges });
});

app.post("/mutate-code", jsonParser, (req: Request, res: Response) => {
  const result = mutateCode(
    req.body.extension,
    req.body.nql,
    req.body.source_code,
    req.body.mutation_code
  );
  res.json({
    affected: result.affected,
    conflicted: result.conflicted,
    new_source: result.newSource,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
  res.status(400).json({ error: err.message });
});

app.use(rollbar.errorHandler());

(async() => {
  await client.connect();
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
})();
