import { Adapter as QueryAdapter } from "@xinminlabs/node-query";
import { Adapter as MutationAdapter } from "@xinminlabs/node-mutation";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { escapeString, getChildKeys, isNode, nodeIsNull, nodesEqual, getNodeSource, getNodeRange } from "../utils";

class FindAndInsertConverter<T> extends BaseConverter<T> {
  constructor(protected parser: string, protected inputNodes: T[], protected outputNodes: T[], protected builderNode: BuilderNode) {
    super(parser, inputNodes, outputNodes, builderNode);
    this.insertResults = [];
  }

  call() {
    if (this.inputIsEmptyAndInsert()) {
      return;
    }
    if (this.inputIsAChildOfOutputAndInsert()) {
      return;
    }

    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];
    this.iterateNodes(firstInputNode, firstOutputNode);

    this.buildInsertPattern(this.insertResults, this.builderNode);
  }

  /**
   * Check if input is empty, then insert the whole output.
   * @returns {boolean} true if input is empty and insert, false otherwise.
   */
  private inputIsEmptyAndInsert(): boolean {
    if (this.inputNodes.some(node => !nodeIsNull(node))) {
      return false;
    }

    this.builderNode.addConvertPattern(`insert(${escapeString(getNodeSource(this.outputNodes[0], this.nodeQueryAdapter()))}, { at: "beginning" });`);
    return true;
  }

  private inputIsAChildOfOutputAndInsert(): boolean {
    const inputNode = this.inputNodes[0];
    const outputNode = this.outputNodes[0];
    if (!isNode(inputNode) || !isNode(outputNode)) {
      return false;
    }

    const childKey = getChildKeys(outputNode, this.nodeQueryAdapter()).find(key => nodesEqual(outputNode[key], inputNode, this.nodeQueryAdapter()));
    if (!childKey) {
      return false;
    }

    const outputNodeRange = getNodeRange(outputNode, this.nodeMutationAdapter());
    const outputChildNodeRange = getNodeRange(outputNode[childKey], this.nodeMutationAdapter());
    const outputNodeSource = getNodeSource(outputNode, this.nodeQueryAdapter());
    if (outputChildNodeRange.start - outputNodeRange.start > 0) {
      this.buildInsertPattern([{
        newCode: outputNodeSource.substring(0, outputChildNodeRange.start - outputNodeRange.start),
        at: "beginning",
      }], this.builderNode);
    }
    if (outputNodeRange.end - outputChildNodeRange.end > 0) {
      this.buildInsertPattern([{
        newCode: outputNodeSource.substring(outputChildNodeRange.end - outputNodeRange.end, outputNodeSource.length - 1),
        at: "end",
      }], this.builderNode);
    }
    return true;
  }
}

export default FindAndInsertConverter;
