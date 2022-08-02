import { Node } from "typescript";
import { BuilderNode } from "../builder";

class BaseConverter {
  constructor(protected inputNodes: Node[], protected outputNodes: Node[], protected builderNode: BuilderNode) {}
}

export default BaseConverter;