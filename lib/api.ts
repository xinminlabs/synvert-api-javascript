import { Client } from '@elastic/elasticsearch';
import { VM } from "vm2";
import ts from 'typescript';
import fs from 'fs';
import mock from 'mock-fs';
import NodeQuery from "@xinminlabs/node-query";
import NodeMutation, { ProcessResult } from "@xinminlabs/node-mutation";
import Magic from "./magic";
import { NqlOrRules } from './magic/types';
import { getFileName, parseCode } from "./magic/utils";
import { Rewriter } from 'synvert-core';
import type { Location, Range } from "./types";

const client = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

export const generateAst = (extension: string, code: string): any => {
  return parseCode(extension, code, false);
}

export const parseSynvertSnippet = (extension: string, code: string, snippet: string): string => {
  try {
    parseCode(extension, code, false);
    parseCode(extension, snippet, false);
    const fileName = getFileName(extension);
    const rewriter = eval(formatSnippet(extension, snippet));
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
  const result = await client.search({ index: 'synvert-javascript-snippets',
    body: {
      query: {
        bool: {
          should: [{
            match_bool_prefix: {
              group: { query },
            }
          }, {
            match_bool_prefix: {
              name: { query },
            }
          }, {
            match_bool_prefix: {
              description: { query },
            }
          }]
        }
      }
    }
  });
  if (result.body.hits.total.value > 0) {
    return result.body.hits.hits.map(hit => Object.assign({ id: hit._id }, hit._source));
  } else {
    return [];
  }
}

export const parseNql = (
  extension: string,
  nql: string,
  source: string
): Range[] => {
  const node = parseCode(extension, source, true);
  const nodeQuery = new NodeQuery<ts.Node>(nql);
  const matchingNodes = nodeQuery.queryNodes(node);
  return matchingNodes.map((matchingNode) => {
    return {
      start: parseStartLocation(matchingNode),
      end: parseEndLocation(matchingNode),
    };
  });
};

export const mutateCode = (
  extension: string,
  nql: string,
  source: string,
  mutationCode: string
): ProcessResult => {
  parseCode(extension, mutationCode, true);
  const node = parseCode(extension, source, true);
  const nodeQuery = new NodeQuery<ts.Node>(nql);
  const matchingNodes = nodeQuery.queryNodes(node);
  const nodeMutation = new NodeMutation<ts.Node>(source);

  matchingNodes.forEach((node) => {
    const newCode = mutationCode
      .split("\n")
      .map((code) => `nodeMutation.${code}`);
    const vm = new VM({ sandbox: { node, nodeMutation }, eval: false });
    vm.run(newCode.join("\n"));
  });
  return nodeMutation.process();
};

const parseStartLocation = (node: ts.Node): Location => {
  const { line, character } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart());
  return { line: line + 1, column: character + 1 };
};

const parseEndLocation = (node: ts.Node): Location => {
  const { line, character } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getEnd());
  return { line: line + 1, column: character + 1 };
};

const formatSnippet = (extension: string, snippet: string): string => {
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