import ts from "typescript";
import * as espree from "@xinminlabs/espree";
import { Node as EspreeNode } from "acorn";
import gonzales from "@xinminlabs/gonzales-pe";

export const parseJS = (source: string): ts.Node => {
  return ts.createSourceFile("code.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS).statements[0];
}

export const parseJSX = (source: string): ts.Node => {
  return ts.createSourceFile("code.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX).statements[0];
}

export const parseTS = (source: string): ts.Node => {
  return ts.createSourceFile("code.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).statements[0];
}

export const parseJsByEspree = (source: string, sourceFile: string = "code.js"): EspreeNode => {
  return espree.parse(source, {
    ecmaVersion: "latest",
    loc: true,
    sourceType: "module",
    sourceFile,
    ecmaFeatures: { jsx: true },
  });
}

export const parseCss = (source: string, sourceFile: string = "code.css"): gonzales.Node => {
  return gonzales.parse(source, { syntax: "css", sourceFile });
}

export const parseLess = (source: string, sourceFile: string = "code.less"): gonzales.Node => {
  return gonzales.parse(source, { syntax: "less", sourceFile });
}

export const parseSass = (source: string, sourceFile: string = "code.sass"): gonzales.Node => {
  return gonzales.parse(source, { syntax: "sass", sourceFile });
}

export const parseScss = (source: string, sourceFile: string = "code.scss"): gonzales.Node => {
  return gonzales.parse(source, { syntax: "scss", sourceFile });
}