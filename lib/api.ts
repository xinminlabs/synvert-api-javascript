import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import mock from 'mock-fs';
import Magic from "./magic";
import { NqlOrRules } from './magic/types';
import { getFileName, parseCode, runInVm } from "./magic/utils";
import { Rewriter } from 'synvert-core';

const client = new Client({ node: process.env.ELASTICSEARC_URL || 'http://localhost:9200' });

export const generateAst = (extension: string, code: string): any => {
  return parseCode(extension, code, false);
}

export const parseSynvertSnippet = (extension: string, code: string, snippet: string): string => {
  try {
    const fileName = getFileName(extension);
    runInVm(wrapSnippet(extension, snippet));
    const rewriter = getRewriter();
    mock({ [fileName]: code });
    rewriter.process();
    return fs.readFileSync(fileName, 'utf-8');
  } finally {
    Rewriter.rewriters = {};
    mock.restore();
  }
}

export const generateSnippet = (extension: string, inputs: string[], outputs: string[], nqlOrRules = NqlOrRules.nql): string => {
  return Magic.call(extension, inputs, outputs, nqlOrRules);
}

export const querySnippets = async (query: string): Promise<object[]> => {
  const result = await client.search({ index: 'synvert-javascript-snippets', body: { query: { query_string: { query } } } });
  if (result.body.hits.total.value > 0) {
    return result.body.hits.hits.map(hit => Object.assign({ id: hit._id }, hit._source));
  } else {
    return [];
  }
}

const getRewriter = (): Rewriter => {
  const group = Object.keys(Rewriter.rewriters)[0];
  const name = Object.keys(Rewriter.rewriters[group])[0];
  return Rewriter.fetch(group, name);
}

const wrapSnippet = (extension: string, snippet: string): string => {
  const input = snippet.trim();
  if (input.startsWith("const Synvert = require('synvert-core')")) {
    return snippet;
  }
  if (input.startsWith('const Synvert = require("synvert-core")')) {
    return snippet;
  }
  if (input.startsWith("new Synvert.Rewriter(")) {
    return `const Synvert = require("synvert-core");\n` + snippet;
  }
  if (input.startsWith("withinFiles")) {
    return `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("group", "name", () => {
        configure({ parser: 'typescript' });
        ${snippet}
      });
    `;
  }

  const fileConstant = ["ts", "tsx"].includes(extension) ? "ALL_TS_FILES" : "ALL_JS_FILES";
  return `
    const Synvert = require("synvert-core");
    new Synvert.Rewriter("group", "name", () => {
      configure({ parser: 'typescript' });
      withinFiles(Synvert.${fileConstant}, function () {
        ${snippet}
      });
    });
  `;
}