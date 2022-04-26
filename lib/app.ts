import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import { generateAst, parseSynvertSnippet } from './api';

const port = process.env.PORT || 3000;
const app: Express = express();
const jsonParser = bodyParser.json();
app.use(cors())
app.use(morgan('combined'))

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Synvert!');
});

app.post('/generate-ast', jsonParser, (req: Request, res: Response) => {
  const node = generateAst(req.body.code);
  res.json({ node: node });
});

app.post('/parse-synvert-snippet', jsonParser, (req: Request, res: Response) => {
  const output = parseSynvertSnippet(req.body.code, req.body.snippet);
  res.json({ output: output });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ error: err.message });
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
