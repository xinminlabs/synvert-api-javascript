import BaseConverter from "./base-converter";
import { getChildKeys, isNode, nodesEqual } from "../utils";

class FindAndDeleteConverter extends BaseConverter {
  call() {
    if (this.outputIsAChildOfInputAndDelete()) {
      return;
    }

    this.iterateNodes(this.inputNodes[0], this.outputNodes[0]);

    if (this.deleteResults.length === 0) {
      return;
    }

    this.buildDeletePattern(this.inputNodes[0], this.deleteResults, this.builderNode);
  }

  private outputIsAChildOfInputAndDelete(): boolean {
    const inputNode = this.inputNodes[0];
    const outputNode = this.outputNodes[0];
    if (!isNode(inputNode) || !isNode(outputNode)) {
      return false;
    }

    const childKeys = getChildKeys(inputNode);
    const childKey = childKeys.find((key) => nodesEqual(inputNode[key], outputNode));
    if (!childKey) {
      return false;
    }

    const index = childKeys.indexOf(childKey);
    if (index > 0) {
      this.buildDeletePattern(inputNode, childKeys.slice(0, index), this.builderNode);
    }
    if (index < childKeys.length) {
      this.buildDeletePattern(inputNode, childKeys.slice(index + 1), this.builderNode);
    }
    return true;
  }
}

export default FindAndDeleteConverter;
