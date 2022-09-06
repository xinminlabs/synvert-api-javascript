import ts from "typescript";

export const parseJS = (source: string): ts.Node => {
  return ts.createSourceFile("code.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS).statements[0];
}

export const parseJSX = (source: string): ts.Node => {
  return ts.createSourceFile("code.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX).statements[0];
}

export const parseTS = (source: string): ts.Node => {
  return ts.createSourceFile("code.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).statements[0];
}