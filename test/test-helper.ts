import ts from "typescript";

export const parseJS = (source: string): ts.Node => {
  return ts.createSourceFile("code.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS).statements[0]['expression'];
}

export const parseTS = (source: string): ts.Node => {
  return ts.createSourceFile("code.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).statements[0]['expression'];
}