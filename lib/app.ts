import express, { Express, Request, Response, NextFunction } from 'express';
import Rollbar from 'rollbar';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { redisClient } from './connection';
import { generateAst, generateSnippet, parseSynvertSnippet, parseNql, mutateCode, getAllSnippetsJson, querySnippets, getAllSyntaxKind, getTypescriptVersion } from './api';
import { parseCode } from "./magic/utils";

const port = Number(process.env.PORT) || 4000;
const app: Express = express();
const jsonParser = bodyParser.json();
app.set('etag', false);
app.use(cors())
app.use(morgan('combined'))

const SYNVERT_JAVASCRIPT_SNIPPETS_ETAG = "synvert-javascript-snippets-etag";

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

const timeoutAfter = (seconds: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Timed out."));
    }, seconds * 1000);
  });
}

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Synvert!');
});

app.get('/syntax-kinds', (req: Request, res: Response) => {
  const clientEtag = req.get('If-None-Match');
  const serverEtag = getTypescriptVersion();
  if (clientEtag === serverEtag) {
    res.status(304).end();
    return
  }

  res.set("ETag", serverEtag);
  res.set('Content-Type', 'application/json');
  res.json({ 'syntax_kinds': getAllSyntaxKind() });
});

app.post('/generate-ast', jsonParser, (req: Request, res: Response) => {
  const node = generateAst(req.body.extension, req.body.code);
  res.json({ node });
});

app.post('/parse-synvert-snippet', jsonParser, (req: Request, res: Response) => {
  const output = parseSynvertSnippet(req.body.extension, req.body.code, req.body.snippet);
  res.json({ output });
});

app.post('/generate-snippet', jsonParser, validateInputsOutputs, async (req: Request, res: Response) => {
  try {
    const snippet = await Promise.race([
      generateSnippet(req.body.extension, req.body.inputs, req.body.outputs, req.body.nql_or_rules),
      timeoutAfter(10)
    ]);
    if (snippet) {
      res.json({ snippet });
    } else {
      res.status(400).json({ error: 'Failed to generate the snippet!' });
    }
  } catch {
    res.status(400).json({ error: 'Timed out.'});
  }
});

app.get('/snippets', async (req: Request, res: Response) => {
  const clientEtag = req.get('If-None-Match');
  const serverEtag = await redisClient().get(SYNVERT_JAVASCRIPT_SNIPPETS_ETAG);
  if (clientEtag === serverEtag) {
    res.status(304).end();
    return
  }

  res.set("ETag", serverEtag);
  res.set('Content-Type', 'application/json');
  let response = await getAllSnippetsJson();
  res.send(response);
});

// it is deprecated, use /snippets instead and query on client side
app.post('/query-snippets', jsonParser, async (req: Request, res: Response) => {
  const snippets = await querySnippets(req.body.query);
  res.json({ snippets });
});

const ONE_DAY = 60 * 60 * 24;
const JAVASCRIPT_VERSIONS = 'javascript_versions';

app.get('/check-versions', async (req: Request, res: Response) => {
  const versions = await redisClient().hGetAll(JAVASCRIPT_VERSIONS);
  let synvertVersion = versions['synvert_version'];
  let synvertCoreVersion = versions['synvert_core_version'];
  if (!synvertVersion || !synvertCoreVersion) {
    const synvertResponse = await fetch('https://registry.npmjs.org/synvert/latest');
    const synvertJSON = await synvertResponse.json();
    synvertVersion = synvertJSON['version'];
    const synvertCoreResponse = await fetch('https://registry.npmjs.org/synvert-core/latest');
    const synvertCoreJSON = await synvertCoreResponse.json();
    synvertCoreVersion = synvertCoreJSON['version'];
    await redisClient().hSet(JAVASCRIPT_VERSIONS, { synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
    await redisClient().expire(JAVASCRIPT_VERSIONS, ONE_DAY);
  }
  res.json({ synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
});

app.post('/npmjs-webhook', async (req: Request, res: Response) => {
  console.log(req.params.event, req.params.name, req.params.version)
  if (req.params.event === "package:publish") {
    await redisClient().hSet(JAVASCRIPT_VERSIONS, `${req.param.name.replace('-', '_')}_version`, req.params.version);
  }
  res.json({});
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
  await redisClient().connect();
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
})();
