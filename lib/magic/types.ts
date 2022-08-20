import { Node } from "typescript";
import { BuilderNode } from "./builder";

export enum NqlOrRules {
  nql = "nql",
  rules = "rules",
};

export interface ConvertPatternOptions {
  inputNodes: Node[],
  outputNodes: Node[],
  builderNode: BuilderNode
  converterType: string;
}
