import express, { Express, Request, Response, NextFunction } from 'express';
import Rollbar from 'rollbar';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import {
  JAVASCRIPT_VERSIONS,
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
} from './constants';
import { redisClient } from './connection';
import { generateAst, generateSnippets, parseSynvertSnippet, parseNql, mutateCode, getAllSyntaxKind, getTypescriptVersion } from './api';
import { getFileName, parseCode } from "./magic/utils";

const port = Number(process.env.PORT) || 4000;
const app: Express = express();
const jsonParser = bodyParser.json();
app.set('etag', false);
app.use(cors())
app.use(morgan('combined'))

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
    for (let input of req.body.inputs) {
      parseCode(req.body.language, getParser(req.body.parser), getFileName(req.body.language), input);
    }
  } catch (e) {
    return res.status(400).json({ error: "Inputs are invalid. " + e.message });
  }
  try {
    for (let output of req.body.outputs) {
      parseCode(req.body.language, getParser(req.body.parser), getFileName(req.body.language), output);
    }
  } catch (e) {
    return res.status(400).json({ error: "Outputs are invalid. " + e.message });
  }
  const [inputs, outputs] = formatInputsOutputs(req)
  if (inputs.length === 0 && outputs.length === 0) {
    return res.status(400).json({ error: "Inputs and outputs can not be empty string." });
  }
  next();
}

const formatInputsOutputs = (req: Request): [inputs: string[], outputs: string[]] => {
  const inputs: string[] = req.body.inputs;
  const outputs: string[] = req.body.outputs;
  while (true) {
    if (inputs[inputs.length - 1].length === 0 && outputs[outputs.length - 1].length === 0) {
      inputs.pop();
      outputs.pop();
    } else {
      break;
    }
  }
  return [inputs, outputs];
}

const timeoutAfter = (seconds: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Timed out."));
    }, seconds * 1000);
  });
}

const getParser = (parser: string | null) => {
  return parser || "typescript";
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
  const node = generateAst(req.body.language, getParser(req.body.parser), req.body.code);
  res.json({ node });
});

app.post('/parse-synvert-snippet', jsonParser, (req: Request, res: Response) => {
  const output = parseSynvertSnippet(req.body.language, getParser(req.body.parser), req.body.code, req.body.snippet);
  res.json({ output });
});

app.post('/generate-snippet', jsonParser, validateInputsOutputs, async (req: Request, res: Response) => {
  try {
    const [inputs, outputs] = formatInputsOutputs(req);
    const snippets = await Promise.race<string[] | Promise<any>>([
      generateSnippets(req.body.language, getParser(req.body.parser), inputs, outputs, req.body.nql_or_rules),
      timeoutAfter(10)
    ]);
    if (snippets.length > 0) {
      res.json({ snippet: snippets[0], snippets });
    } else {
      res.status(400).json({ error: 'Failed to generate the snippet!' });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

function serverEtagName(language: string) {
  switch (language) {
    case "css":
      return CSS_SNIPPETS_ETAG;
    case "less":
      return LESS_SNIPPETS_ETAG;
    case "sass":
      return SASS_SNIPPETS_ETAG;
    case "scss":
      return SCSS_SNIPPETS_ETAG;
    case "typescript":
      return TYPESCRIPT_SNIPPETS_ETAG;
    default:
      return JAVASCRIPT_SNIPPETS_ETAG;
  }
}

function snippetsName(language: string) {
  switch (language) {
    case "css":
      return CSS_SNIPPETS;
    case "less":
      return LESS_SNIPPETS;
    case "sass":
      return SASS_SNIPPETS;
    case "scss":
      return SCSS_SNIPPETS;
    case "typescript":
      return TYPESCRIPT_SNIPPETS;
    default:
      return JAVASCRIPT_SNIPPETS;
  }
}

app.get('/snippets', async (req: Request, res: Response) => {
  const language = req.query.language as string;
  const clientEtag = req.get('If-None-Match');
  const client = redisClient();
  await client.connect();
  const serverEtag = await client.get(serverEtagName(language));
  if (clientEtag === serverEtag) {
    res.status(304).end();
    await client.disconnect();
    return
  }

  res.set("ETag", serverEtag);
  res.set('Content-Type', 'application/json');
  let response = await client.get(snippetsName(language));
  JSON.parse(response)
  res.json({ snippets: JSON.parse(response) });
  await client.disconnect();
});

// it is deprecated, use /snippets instead and query on client side
// app.post('/query-snippets', jsonParser, async (req: Request, res: Response) => {
//   const snippets = await querySnippets(req.body.query);
//   res.json({ snippets });
// });

const ONE_DAY = 60 * 60 * 24;

app.get('/check-versions', async (req: Request, res: Response) => {
  const client = redisClient();
  await client.connect();
  const versions = await client.hGetAll(JAVASCRIPT_VERSIONS);
  let synvertVersion = versions['synvert_version'];
  let synvertCoreVersion = versions['synvert_core_version'];
  if (!synvertVersion || !synvertCoreVersion) {
    const synvertResponse = await fetch('https://registry.npmjs.org/synvert/latest');
    const synvertJSON = await synvertResponse.json();
    synvertVersion = synvertJSON['version'];
    const synvertCoreResponse = await fetch('https://registry.npmjs.org/synvert-core/latest');
    const synvertCoreJSON = await synvertCoreResponse.json();
    synvertCoreVersion = synvertCoreJSON['version'];
    await client.hSet(JAVASCRIPT_VERSIONS, { synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
    await client.expire(JAVASCRIPT_VERSIONS, ONE_DAY);
  }
  await client.disconnect();
  res.json({ synvert_version: synvertVersion, synvert_core_version: synvertCoreVersion });
});

app.post('/npmjs-webhook', async (req: Request, res: Response) => {
  if (req.params.event === "package:publish") {
    const client = redisClient();
    await client.connect();
    await client.hSet(JAVASCRIPT_VERSIONS, `${req.param.name.replace('-', '_')}_version`, req.params.version);
    await client.disconnect();
  }
  res.json({});
});

/*******************
 * node-playground *
 *******************/

app.post("/parse-nql", jsonParser, (req: Request, res: Response) => {
  const ranges = parseNql(req.body.language, getParser(req.body.parser), req.body.nql, req.body.code);
  res.json({ ranges });
});

app.post("/mutate-code", jsonParser, (req: Request, res: Response) => {
  const result = mutateCode(
    req.body.language,
    getParser(req.body.parser),
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
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
})();
