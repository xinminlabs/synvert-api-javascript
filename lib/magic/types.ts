import { Adapter as QueryAdapter } from "@xinminlabs/node-query";
import { Adapter as MutationAdapter } from "@xinminlabs/node-mutation";
import { Node } from "typescript";
import { BuilderNode } from "./builder";

export enum NqlOrRules {
  nql = "nql",
  rules = "rules",
};

export interface ConvertPatternOptions<T> {
  parser: string;
  inputNodes: T[],
  outputNodes: T[],
  builderNode: BuilderNode
  converterType: string;
}
