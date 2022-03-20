import * as espree from "espree";
import fs from 'fs';
import mock from 'mock-fs';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const generateAst = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestBody = JSON.parse(event.body);
  const source = requestBody.code;
  const options = {
    ecmaVersion: "latest",
    loc: true,
    sourceType: "module",
  };
  const node = espree.parse(source, options);
  return {
    statusCode: 200,
    body: JSON.stringify({ node })
  }
}

export const parseSynvertSnippet = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestBody = JSON.parse(event.body);
  const path = requestBody.jsx ? 'code.jsx' : 'code.js';
  const input = requestBody.code;
  const snippet = requestBody.snippet;
  const rewriter = eval(snippet);
  mock({ [path]: input });
  rewriter.process();
  const output = fs.readFileSync(path, 'utf-8');
  mock.restore();
  return {
    statusCode: 200,
    body: JSON.stringify({ output })
  }
}