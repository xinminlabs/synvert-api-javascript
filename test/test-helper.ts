import ts from "typescript";
import NodeQuery, {
  TypescriptAdapter as QueryTypescriptAdapter,
  EspreeAdapter as QueryEspreeAdapter,
  GonzalesPeAdapter as QueryGonzalesPeAdapter,
} from "@xinminlabs/node-query";
import NodeMutation, {
  TypescriptAdapter as MutationTypescriptAdapter,
  EspreeAdapter as MutationEspreeAdapter,
  GonzalesPeAdapter as MutationGonzalesPeAdapter
} from "@xinminlabs/node-mutation";
import * as espree from "@xinminlabs/espree";
import { Node as EspreeNode } from "acorn";
import gonzales from "@xinminlabs/gonzales-pe";

export const parseJS = (source: string): ts.Node => {
  NodeQuery.configure({ adapter: new QueryTypescriptAdapter() });
  NodeMutation.configure({ adapter: new MutationTypescriptAdapter() });
  return ts.createSourceFile("code.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS).statements[0];
}

export const parseJSX = (source: string): ts.Node => {
  NodeQuery.configure({ adapter: new QueryTypescriptAdapter() });
  NodeMutation.configure({ adapter: new MutationTypescriptAdapter() });
  return ts.createSourceFile("code.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX).statements[0];
}

export const parseTS = (source: string): ts.Node => {
  NodeQuery.configure({ adapter: new QueryTypescriptAdapter() });
  NodeMutation.configure({ adapter: new MutationTypescriptAdapter() });
  return ts.createSourceFile("code.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).statements[0];
}

export const parseJsByEspree = (source: string, sourceFile: string = "code.js"): EspreeNode => {
  NodeQuery.configure({ adapter: new QueryEspreeAdapter() });
  NodeMutation.configure({ adapter: new MutationEspreeAdapter() });
  return espree.parse(source, {
    ecmaVersion: "latest",
    loc: true,
    sourceType: "module",
    sourceFile,
    ecmaFeatures: { jsx: true },
  });
}

export const parseCss = (source: string, sourceFile: string = "code.css"): gonzales.Node => {
  NodeQuery.configure({ adapter: new QueryGonzalesPeAdapter() });
  NodeMutation.configure({ adapter: new MutationGonzalesPeAdapter() });
  return gonzales.parse(source, { syntax: "css", sourceFile });
}

export const parseLess = (source: string, sourceFile: string = "code.less"): gonzales.Node => {
  NodeQuery.configure({ adapter: new QueryGonzalesPeAdapter() });
  NodeMutation.configure({ adapter: new MutationGonzalesPeAdapter() });
  return gonzales.parse(source, { syntax: "less", sourceFile });
}

export const parseSass = (source: string, sourceFile: string = "code.sass"): gonzales.Node => {
  NodeQuery.configure({ adapter: new QueryGonzalesPeAdapter() });
  NodeMutation.configure({ adapter: new MutationGonzalesPeAdapter() });
  return gonzales.parse(source, { syntax: "sass", sourceFile });
}

export const parseScss = (source: string, sourceFile: string = "code.scss"): gonzales.Node => {
  NodeQuery.configure({ adapter: new QueryGonzalesPeAdapter() });
  NodeMutation.configure({ adapter: new MutationGonzalesPeAdapter() });
  return gonzales.parse(source, { syntax: "scss", sourceFile });
}