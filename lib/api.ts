import { QueryTypes } from "sequelize";
import { VM } from "vm2";
import ts from 'typescript';
import fs from 'fs';
import mock from 'mock-fs';
import NodeQuery from "@xinminlabs/node-query";
import NodeMutation, { ProcessResult } from "@xinminlabs/node-mutation";
import { databaseClient, redisClient } from './connection';
import Magic from "./magic";
import { NqlOrRules } from './magic/types';
import { getFileName, parseCode, parseFullCode } from "./magic/utils";
import { Rewriter, rewriteSnippetToSyncVersion } from 'synvert-core';
import type { Location, Range, Snippet } from "./types";

export const getTypescriptVersion = () => {
  return ts.version;
}

export const getAllSyntaxKind = () => {
  return ts.SyntaxKind;
}

export const generateAst = (language: string, code: string): any => {
  return parseFullCode(language, code, false);
}

export const parseSynvertSnippet = (language: string, code: string, snippet: string): string => {
  try {
    parseCode(language, code, false);
    parseCode(language, snippet, false);
    const fileName = getFileName(language);
    mock({ [fileName]: code });
    const rewriter: Rewriter = eval(rewriteSnippetToSyncVersion(formatSnippet(language, snippet)));
    rewriter.processSync();
    return fs.readFileSync(fileName, 'utf-8');
  } finally {
    Rewriter.rewriters = {};
    mock.restore();
  }
}

export const generateSnippet = (language: string, inputs: string[], outputs: string[], nqlOrRules = NqlOrRules.nql): string => {
  return Magic.call(language, inputs, outputs, nqlOrRules);
}

const ONE_DAY = 60 * 60 * 24;
const ALL_JAVASCRIPT_SNIPPETS = "all_javascript_snippets";

export const getAllSnippetsJson = async (): Promise<string> => {
  let response = await redisClient().get(ALL_JAVASCRIPT_SNIPPETS);
  if (!response) {
    const snippets = await databaseClient().query("SELECT * FROM javascript_snippets", { type: QueryTypes.SELECT });
    response = JSON.stringify({ snippets });
    await redisClient().set(ALL_JAVASCRIPT_SNIPPETS, response);
    await redisClient().expire(ALL_JAVASCRIPT_SNIPPETS, ONE_DAY);
  }
  return response;
}

export const querySnippets = async (query: string): Promise<Snippet[]> => {
  const response: { snippets: Snippet[] } = JSON.parse(await getAllSnippetsJson());
  return response.snippets.filter(snippet => (
    snippet.name.toLowerCase().includes(query.toLowerCase()) ||
      snippet.group.toLowerCase().includes(query.toLowerCase()) ||
      (snippet.description && snippet.description.toLowerCase().includes(query.toLowerCase()))
  ));
}

// export const querySnippets = async (query: string): Promise<object[]> => {
//   const result = await client.search({ index: 'synvert-javascript-snippets',
//     body: {
//       query: {
//         bool: {
//           should: [{
//             match_bool_prefix: {
//               group: { query },
//             }
//           }, {
//             match_bool_prefix: {
//               name: { query },
//             }
//           }, {
//             match_bool_prefix: {
//               description: { query },
//             }
//           }]
//         }
//       }
//     }
//   });
//   if (result.body.hits.total.value > 0) {
//     return result.body.hits.hits.map(hit => Object.assign({ id: hit._id }, hit._source));
//   } else {
//     return [];
//   }
// }

export const parseNql = (
  language: string,
  nql: string,
  source: string
): Range[] => {
  const node = parseFullCode(language, source, true);
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
  language: string,
  nql: string,
  source: string,
  mutationCode: string
): ProcessResult => {
  parseCode(language, mutationCode, true);
  const node = parseFullCode(language, source, true);
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

const formatSnippet = (language: string, snippet: string): string => {
  const input = snippet.trim();
  if (input.startsWith("const Synvert = require('synvert-core')")) {
    return snippet;
  }
  if (input.startsWith('const Synvert = require("synvert-core")')) {
    return snippet;
  }
  if (input.startsWith("new Synvert.Rewriter(")) {
    return snippet;
  }
  if (input.startsWith("withinFiles")) {
    return `
      new Synvert.Rewriter("group", "name", () => {
        configure({ parser: Synvert.Parser.TYPESCRIPT });
        ${snippet}
      });
    `;
  }

  const fileConstant = language === "typescript" ? "ALL_TS_FILES" : "ALL_JS_FILES";
  return `
    new Synvert.Rewriter("group", "name", () => {
      configure({ parser: Synvert.Parser.TYPESCRIPT });
      withinFiles(Synvert.${fileConstant}, function () {
        ${snippet}
      });
    });
  `;
}
