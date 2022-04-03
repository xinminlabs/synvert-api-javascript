import * as espree from "espree";
import fs from 'fs';
import path from 'path';
import mock from 'mock-fs';

export const generateAst = (source: string, filePath: string): any => {
  const options = {
    ecmaVersion: "latest",
    loc: true,
    sourceType: "module",
  };
  if (jsxEnabled(filePath)) {
    options["ecmaFeatures"] = { jsx: true };
  }
  return espree.parse(source, options);
}

export const parseSynvertSnippet = (source: string, filePath: string, snippet: string): string => {
  try {
    const rewriter = eval(wrapSnippet(snippet));
    mock({ [filePath]: source });
    rewriter.process();
    return fs.readFileSync(filePath, 'utf-8');
  } finally {
    mock.restore();
  }
}

const jsxEnabled = (filePath: string) : boolean => {
  return path.extname(filePath) === ".jsx";
}

const wrapSnippet = (snippet: string): string => {
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
        ${snippet}
      });
    `;
  }

  return `
    const Synvert = require("synvert-core")
    new Synvert.Rewriter("group", "name", () => {
      withinFiles(Synvert.ALL_FILES, function () {
        ${snippet}
      });
    });
  `;
}