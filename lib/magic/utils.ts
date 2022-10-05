import { KEYS } from "typescript-visitor-keys";
import { createProgram, createSourceFile, Node, SyntaxKind, ScriptKind, ScriptTarget } from "typescript";
import { KeyNotFoundError } from "./error";
import { TypescriptAdapter } from "@xinminlabs/node-mutation"

export const getFileName = (extension: string): string => {
  return `code.${extension}`;
}

const typescriptAdapter = new TypescriptAdapter();

export const getNodeRange = (node: Node): { start :number, end: number } => {
  return { start: typescriptAdapter.getStart(node), end: typescriptAdapter.getEnd(node) };
}

export const getSource = (node: Node): string => {
  return typescriptAdapter.getSource(node);
}

export const parseCode = (extension: string, code: string, parent = true): Node => {
  const fileName = getFileName(extension);
  const scriptKind = getScriptKind(extension);
  const node = createSourceFile(fileName, code, ScriptTarget.Latest, parent, scriptKind);
  const program = createProgram([fileName], {});
  const diagnotics = program.getSyntacticDiagnostics(node);
  if (diagnotics.length > 0) {
    throw new SyntaxError(diagnotics[0].messageText.toString());
  }
  return node.statements[0];
}

export const getNodeType = (node: Node) => SyntaxKind[node.kind];

export const isNode = (value: any): value is Node => value && value instanceof Object && 'kind' in value;

export const allNodes = (values: any[]): boolean => values.every(value => isNode(value));

export const allArrays = (values: any[]): boolean => values.every(value => Array.isArray(value));

export const allEqual = (values: any[]): boolean => values.every(value => value === values[0]);

export const allNodeTypeEqual = (nodes: Node[]): boolean => nodes.every(node => isNode(node) && node.kind === nodes[0].kind);

export const allNodesEqual = (nodes: Node[]): boolean => nodes.every(node => nodesEqual(node, nodes[0]));

export const nodesEqual = (node1: Node, node2: Node): boolean => {
  if (!isNode(node1)) {
    return false;
  }
  if (!isNode(node2)) {
    return false;
  }
  if (node1.kind != node2.kind) {
    return false;
  }
  const nodeType = getNodeType(node1);
  if (nodeType === "Identifier") {
    return node1['escapedText'] === node2['escapedText'];
  } else {
    return getChildKeys(nodeType).every(key => valuesEqual(node1[key], node2[key]));
  }
}

export const ignoredAttribute = (key: string, value: any): boolean => {
  return ["typeArguments", "exclamationToken"].includes(key) && value === undefined;
}

export const getChildKeys = (nodeType: string): string[] => {
  const childKeys = KEYS[nodeType];
  if (!childKeys) {
    throw new KeyNotFoundError(`no child keys for ${nodeType}`);
  }
  return childKeys;
}

export const escapeString = (str: string): string => {
  if (str.includes("\n")) {
    return `\`${str}\``;
  }
  return `"${str}"`;
}

const valuesEqual = (value1: any, value2: any): boolean => {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    return value1.every((v1, index) => {
      return valuesEqual(v1, value2[index]);
    })
  } else if (isNode(value1) && isNode(value2)) {
    return nodesEqual(value1, value2);
  } else {
    return value1 === value2;
  }
}

const getScriptKind = (extension: string): ScriptKind => {
  switch (extension) {
    case "ts":
    case "tsx":
      return ScriptKind.TSX;
    case "js":
    case "jsx":
      return ScriptKind.JSX;
    default:
      return ScriptKind.Unknown;
  }
}