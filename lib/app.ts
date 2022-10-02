import express, { Express, Request, Response, NextFunction } from 'express';
import Rollbar from 'rollbar';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { generateAst, generateSnippet, parseSynvertSnippet, querySnippets } from './api';
import { parseCode } from "./magic/utils";

const port = process.env.PORT || 3000;
const app: Express = express();
const jsonParser = bodyParser.json();
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

app.post('/query-snippets', jsonParser, async (req: Request, res: Response) => {
  const snippets = await querySnippets(req.body.query);
  res.json({ snippets });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
  res.status(400).json({ error: err.message });
});

app.use(rollbar.errorHandler());

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
