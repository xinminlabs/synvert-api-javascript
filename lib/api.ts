import fs from 'fs';
import mock from 'mock-fs';
import Magic from "./magic";
import { getFileName, parseCode } from "./magic/utils";

export const generateAst = (extension: string, code: string): any => {
  return parseCode(extension, code, false);
}

export const parseSynvertSnippet = (extension: string, code: string, snippet: string): string => {
  try {
    const fileName = getFileName(extension);
    const rewriter = eval(wrapSnippet(extension, snippet));
    mock({ [fileName]: code });
    rewriter.process();
    return fs.readFileSync(fileName, 'utf-8');
  } finally {
    mock.restore();
  }
}

export const generateSnippet = (extension: string, inputs: string[], outputs: string[]): string => {
  return Magic.call(extension, inputs, outputs);
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
    return `const Synvert = require("synvert-core")\n` + snippet;
  }
  if (input.startsWith("withinFiles")) {
    return `
      const Synvert = require("synvert-core")
      new Synvert.Rewriter("group", "name", () => {
        configure({ parser: 'typescript' });
        ${snippet}
      });
    `;
  }

  const fileConstant = ["ts", "tsx"].includes(extension) ? "ALL_TS_FILES" : "ALL_JS_FILES";
  return `
    const Synvert = require("synvert-core")
    new Synvert.Rewriter("group", "name", () => {
      configure({ parser: 'typescript' });
      withinFiles(Synvert.${fileConstant}, function () {
        ${snippet}
      });
    });
  `;
}