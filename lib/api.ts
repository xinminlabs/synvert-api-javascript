import { VM } from "vm2";
import ts from "typescript";
import fs from "fs";
import mock from "mock-fs";
import NodeQuery from "@xinminlabs/node-query";
import NodeMutation, { ProcessResult, Adapter as MutationAdapter, TypescriptAdapter as MutationTypescriptAdapter, EspreeAdapter as MutationEspreeAdapter, GonzalesPeAdapter as MutationGonzalesPeAdapter } from "@xinminlabs/node-mutation";
import Magic from "./magic";
import { NqlOrRules } from './magic/types';
import { getFileName, parseCode, parseFullCode } from "./magic/utils";
import { Rewriter, rewriteSnippetToSyncVersion } from 'synvert-core';
import type { Location, Range } from "./types";

export const getTypescriptVersion = () => {
  return ts.version;
}

export const getAllSyntaxKind = () => {
  return ts.SyntaxKind;
}

export const generateAst = (language: string, parser: string, code: string): any => {
  const fileName = getFileName(language);
  return parseFullCode(language, parser, fileName, code, false);
}

export function parseSynvertSnippet<T>(language: string, parser: string, code: string, snippet: string): string {
  try {
    const fileName = getFileName(language);
    parseCode(language, parser, fileName, code, false);
    parseCode(language, parser, fileName, snippet, false);
    mock({ [fileName]: code });
    const rewriter: Rewriter<T> = eval(rewriteSnippetToSyncVersion(formatSnippet(language, parser, snippet)));
    rewriter.processSync();
    return fs.readFileSync(fileName, 'utf-8');
  } finally {
    Rewriter.rewriters = {};
    mock.restore();
  }
}

export const generateSnippets = (language: string, parser: string, inputs: string[], outputs: string[], nqlOrRules = NqlOrRules.nql): string[] => {
  return Magic.call(language, parser, inputs, outputs, nqlOrRules);
}

// export const querySnippets = async (query: string): Promise<Snippet[]> => {
//   const response: { snippets: Snippet[] } = JSON.parse(await getAllSnippetsJson());
//   return response.snippets.filter(snippet => (
//     snippet.name.toLowerCase().includes(query.toLowerCase()) ||
//       snippet.group.toLowerCase().includes(query.toLowerCase()) ||
//       (snippet.description && snippet.description.toLowerCase().includes(query.toLowerCase()))
//   ));
// }

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

export function parseNql<T>(
  language: string,
  parser: string,
  nql: string,
  source: string
): Range[] {
  const fileName = getFileName(language);
  const node = parseFullCode(language, parser, fileName, source, true);
  const nodeQuery = new NodeQuery<T>(nql, { adapter: parser });
  const mutationAdapter = nodeMutationAdapter<T>(parser);
  const matchingNodes = nodeQuery.queryNodes(node);
  return matchingNodes.map((matchingNode) => {
    return {
      start: parseStartLocation(matchingNode, mutationAdapter),
      end: parseEndLocation(matchingNode, mutationAdapter),
    };
  });
};

export function mutateCode<T>(
  language: string,
  parser: string,
  nql: string,
  source: string,
  mutationCode: string
): ProcessResult {
  const fileName = getFileName(language);
  parseCode(language, parser, fileName, mutationCode, true);
  const node = parseFullCode(language, parser, fileName, source, true);
  const nodeQuery = new NodeQuery<T>(nql, { adapter: parser });
  const matchingNodes = nodeQuery.queryNodes(node);
  const nodeMutation = new NodeMutation<ts.Node>(source, { adapter: parser });

  matchingNodes.forEach((node) => {
    const newCode = mutationCode
      .split("\n")
      .map((code) => `nodeMutation.${code}`);
    const vm = new VM({ sandbox: { node, nodeMutation }, eval: false });
    vm.run(newCode.join("\n"));
  });
  return nodeMutation.process();
};

function parseStartLocation<T>(node: T, mutationAdapter: MutationAdapter<T>): Location {
  const { line, column } = mutationAdapter.getStartLoc(node);
  return { line, column: column + 1 };
};

function parseEndLocation<T>(node: T, mutationAdapter: MutationAdapter<T>): Location {
  const { line, column } = mutationAdapter.getEndLoc(node);
  return { line, column: column + 1 };
};

const formatSnippet = (language: string, parser: string, snippet: string): string => {
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
        configure({ parser: Synvert.Parser.${parser.toUpperCase().replace('-', '_')} });
        ${snippet}
      });
    `;
  }

  const fileConstant = language === "typescript" ? "ALL_TS_FILES" : "ALL_JS_FILES";
  return `
    new Synvert.Rewriter("group", "name", () => {
      configure({ parser: Synvert.Parser.${parser.toUpperCase().replace('-', '_')} });
      withinFiles(Synvert.${fileConstant}, function () {
        ${snippet}
      });
    });
  `;
}

function nodeMutationAdapter<T>(parser: string) {
  switch (parser) {
    case "typescript":
      return new MutationTypescriptAdapter() as MutationAdapter<T>;
    case "espree":
      return new MutationEspreeAdapter() as MutationAdapter<T>;
    case "gonzales-pe":
      return new MutationGonzalesPeAdapter() as MutationAdapter<T>;
    default:
      throw new Error("Unknown node mutation parser");
  }
}
