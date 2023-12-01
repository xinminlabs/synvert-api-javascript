import { Node as TypescriptNode } from "typescript";
import { Node as EspreeNode } from "acorn";
import { Node as GonzalesNode} from "@xinminlabs/gonzales-pe";

export type Location = {
  line: number;
  column: number;
};

export type Range = {
  start: Location;
  end: Location;
};

export type Snippet = {
  id: number,
  group: string,
  name: string,
  description: string,
};

export type InsertResult = {
  at: "beginning" | "end";
  newCode: string;
  to?: string;
}

export type ReplaceResult = {
  key: string;
  newCode: string;
}
