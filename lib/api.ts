import * as espree from "espree";
import fs from 'fs';
import mock from 'mock-fs';

export const generateAst = (source: string): any => {
  const options = {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module",
  };
  return espree.parse(source, options);
}

export const parseSynvertSnippet = (source: string, snippet: string): string => {
  try {
    const rewriter = eval(wrapSnippet(snippet));
    mock({ 'code.js': source });
    rewriter.process();
    return fs.readFileSync('code.js', 'utf-8');
  } finally {
    mock.restore();
  }
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
      withinFiles(Synvert.ALL_JS_FILES, function () {
        ${snippet}
      });
    });
  `;
}