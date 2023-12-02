import path from "path";
import { KEYS as EspreeKeys } from "eslint-visitor-keys";
import { KEYS as TypescriptKeys } from "typescript-visitor-keys";
import NodeQuery, { Adapter as QueryAdapter } from "@xinminlabs/node-query";
import NodeMutation, { Adapter as MutationAdapter } from "@xinminlabs/node-mutation";
import { createProgram, createSourceFile, Node as TypescriptNode, ScriptKind, ScriptTarget } from "typescript";
import { KeyNotFoundError } from "./error";
import * as espree from "@xinminlabs/espree";
import gonzales, { Node as GonzalesNode } from "@xinminlabs/gonzales-pe";
import { Node as EspreeNode } from "acorn";
import { query } from "express";

export const getFileExtension = (language: string): string => {
  switch (language) {
    case "typescript":
      return "ts";
    case "javascript":
      return "js";
    case "css":
      return "css";
    case "less":
      return "less";
    case "sass":
      return "sass";
    case "scss":
      return "scss";
    default:
      return "unknown";
  }
}

export const getFileName = (language: string): string => {
  const extension = getFileExtension(language);
  return `code.${extension}`;
}

export function getNodeRange<T>(node: T, mutationAdapter: MutationAdapter<T>): { start :number, end: number } {
  return { start: mutationAdapter.getStart(node), end: mutationAdapter.getEnd(node) };
}

export const parseFullCode = (language: string, parser: string, fileName: string, code: string, parent = true) => {
  switch (parser) {
    case "espree":
      return parseCodeByEspree(code, fileName)["body"][0];
    case "typescript":
      const scriptKind = getScriptKind(language);
      return parseCodeByTypescript(code, fileName, scriptKind, parent)["statements"][0];
    case "gonzales-pe":
      return parseCodeByGonzalesPe(code, fileName);
  }
}

export const parseCode = (language: string, parser: string, fileName: string, code: string, parent = true) => {
  return parseFullCode(language, parser, fileName, code, parent);
}

export const parseCodeByTypescript = (code: string, filePath: string, scriptKind: ScriptKind, parent = true): TypescriptNode => {
  const node = createSourceFile(filePath, code, ScriptTarget.Latest, parent, scriptKind);
  const program = createProgram([filePath], {});
  const diagnostics = program.getSyntacticDiagnostics(node);
  if (diagnostics.length > 0) {
    throw new SyntaxError(diagnostics[0].messageText.toString());
  }
  return node;
}

export const parseCodeByEspree = (code: string, filePath: string) : EspreeNode =>  {
  return espree.parse(code, {
    ecmaVersion: "latest",
    loc: true,
    sourceType: "module",
    sourceFile: filePath,
    ecmaFeatures: { jsx: true },
  });
}

export const parseCodeByGonzalesPe = (code: string, filePath: string): GonzalesNode => {
  const syntax = path.extname(filePath).split(".").pop();
  return gonzales.parse(code, { syntax, sourceFile: filePath });
}

export const isNode = (value: any): value is TypescriptNode | EspreeNode | GonzalesNode => isTypescriptNode(value) || isEspreeNode(value) || isGonzalesNode(value);

const isTypescriptNode = (value: any): value is TypescriptNode => value && value instanceof Object && 'kind' in value;
const isEspreeNode = (value: any): value is EspreeNode => value && value instanceof Object && 'type' in value && 'loc' in value;
const isGonzalesNode = (value: any): value is GonzalesNode => value && value instanceof Object && 'type' in value && 'syntax' in value;

export const allNodes = (values: any[]): boolean => values.every(value => isNode(value));

export const allArrays = (values: any[]): boolean => values.every(value => Array.isArray(value));

export const allEqual = (values: any[]): boolean => values.every(value => value === values[0]);

export const allUndefined = (values: any[]): boolean => values.every(value => typeof value === "undefined");

export function allNodeTypeEqual<T>(nodes: T[], queryAdapter: QueryAdapter<T>): boolean {
  return nodes.every(node => isNode(node) && getNodeType(node, queryAdapter) === getNodeType(nodes[0], queryAdapter));
}

export function allNodesEqual<T>(nodes: T[], queryAdapter: QueryAdapter<T>): boolean {
  return nodes.every(node => nodesEqual(node, nodes[0], queryAdapter));
}

export function nodeIsNull<T>(node: T): boolean {
  return (typeof node === "undefined") || (Array.isArray(node["body"]) && node["body"].length === 0);
}

export function nodesEqual<T>(node1: T, node2: T, queryAdapter: QueryAdapter<T>): boolean {
  if (!isNode(node1)) {
    return false;
  }
  if (!isNode(node2)) {
    return false;
  }
  return getNodeType(node1, queryAdapter) == getNodeType(node2, queryAdapter) && getNodeSource(node1, queryAdapter) == getNodeSource(node2, queryAdapter);
}

export const ignoredAttribute = (key: string, value: any): boolean => {
  return ["typeArguments", "exclamationToken"].includes(key) && value === undefined;
}

export function getNodeType<T>(node: T, queryAdapter: QueryAdapter<T>): string {
  return queryAdapter.getNodeType(node);
}

export function getNodeSource<T>(node: T, queryAdapter: QueryAdapter<T>): string {
  return queryAdapter.getSource(node);
}

export function getChildKeys<T>(node: T, queryAdapter: QueryAdapter<T>): string[] {
  const nodeType = queryAdapter.getNodeType(node)
  let childKeys;
  if (isTypescriptNode(node)) {
    childKeys = TypescriptKeys[nodeType];
  }
  if (isEspreeNode(node)) {
    childKeys = EspreeKeys[nodeType];
  }
  if (isGonzalesNode(node)) {
    childKeys = Array.isArray(node.content) ? node.content.map(node => node.type) : [];
  }
  if (!childKeys) {
    throw new KeyNotFoundError(`no child keys for ${nodeType}`);
  }
  return childKeys;
}

export const escapeString = (str: string): string => {
  if (str.includes("\n")) {
    return `\`${str}\``;
  }
  if (str.includes('"')) {
    return `'${str}'`;
  }
  return `"${str}"`;
}

function valuesEqual<T>(value1: any, value2: any, queryAdapter: QueryAdapter<T>): boolean {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    return value1.every((v1, index) => {
      return valuesEqual(v1, value2[index], queryAdapter);
    })
  } else if (isNode(value1) && isNode(value2)) {
    return nodesEqual(value1 as T, value2 as T, queryAdapter);
  } else {
    return value1 === value2;
  }
}

const getScriptKind = (language: string): ScriptKind => {
  switch (language) {
    case "typescript":
      return ScriptKind.TSX;
    case "javascript":
      return ScriptKind.JSX;
    default:
      return ScriptKind.Unknown;
  }
}
