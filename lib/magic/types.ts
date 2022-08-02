import { Node } from "typescript";
import { BuilderNode } from "./builder";

export interface ConvertPatternOptions {
  inputNodes: Node[],
  outputNodes: Node[],
  builderNode: BuilderNode
  converterType: string;
}
