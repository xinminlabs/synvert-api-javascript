import clone from "clone";
import BaseConverter from "./base-converter";
import { escapeString } from "../utils";

class FindAndReplaceWithConverter extends BaseConverter {
  call() {
    if (this.outputNodes.length === 0) {
      return;
    }

    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];
    if (typeof firstOutputNode === "undefined") {
      return;
    }

    const replacedNode = this.replaceNode(clone(firstOutputNode), firstInputNode);
    const newStr = this.generateSourceCode(replacedNode);
    this.builderNode.addConvertPattern(`replaceWith(${escapeString(newStr)});`);
  }
}

export default FindAndReplaceWithConverter;