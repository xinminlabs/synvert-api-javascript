import { Node, SyntaxKind } from "typescript";

export const getNodeType = (node: Node) => SyntaxKind[node.kind];

export const isNode = (value: any): value is Node => value && value instanceof Object && 'kind' in value;

export const allNodes = (values: any[]): boolean => values.every(value => isNode(value));

export const allArrays = (values: any[]): boolean => values.every(value => Array.isArray(value));

export const allEqual = (values: any[]): boolean => values.every(value => value === values[0]);

export const allNodeTypeEqual = (nodes: Node[]): boolean => nodes.every(node => isNode(node) && node.kind === nodes[0].kind);

export const allNodesEqual = (nodes: Node[]): boolean => nodes.every(node => nodesEqual(node, nodes[0]));

const nodesEqual = (node1: Node, node2: Node): boolean => {
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
  return visitorKeys[nodeType].every(key => node1[key] == node2[key]);
}

export const visitorKeys = {
  CallExpression: ['expression', 'typeArguments', 'arguments'],
  ExpressionStatement: ['expression'],
  Identifier: [],
  PropertyAccessExpression: ['expression', 'name'],
}