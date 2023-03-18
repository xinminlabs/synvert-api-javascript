import { Node } from "typescript";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { getChildKeys, getNodeType, isNode, nodesEqual } from "../utils";

class DeleteConverter extends BaseConverter {
  private deleteResults: string[];

  constructor(protected inputNodes: Node[], protected outputNodes: Node[], protected builderNode: BuilderNode) {
    super(inputNodes, outputNodes, builderNode);
    this.deleteResults = [];
  }

  call() {
    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];
    this.iterateNodes(firstInputNode, firstOutputNode);

    if (this.deleteResults.length === 0) {
      return;
    }
    if (this.deleteResults.length === 1) {
      const pattern = `delete("${this.deleteResults[0]}");`;
      this.builderNode.addConvertPattern(pattern);
      return;
    }
    const pattern = `delete(["${this.deleteResults.join('", "')}"]);`;
    this.builderNode.addConvertPattern(pattern);
  }

  private iterateNodes(inputNode: Node | Node[], outputNode: Node | Node[], key?: string) {
    if (Array.isArray(inputNode) && Array.isArray(outputNode)) {
      if (outputNode.length >= inputNode.length) {
        return;
      }
      const deleteIndices = [];
      for (let inputIndex = 0, outputIndex = 0; inputIndex < inputNode.length || outputIndex < outputNode.length;) {
        if (nodesEqual(outputNode[outputIndex], inputNode[inputIndex])) {
          outputIndex++;
          inputIndex++;
          continue;
        }
        deleteIndices.push(inputIndex);
        inputIndex++;
      }
      if (deleteIndices.length === inputNode.length - outputNode.length) {
        deleteIndices.forEach((inputIndex) => {
          const index = inputIndex === inputNode.length - 1 ? -1 : inputIndex;
          this.deleteResults.push(key ? `${key}.${index}` : index.toString());
        });
      }
    }

    if (isNode(inputNode) && isNode(outputNode) && getNodeType(inputNode) === getNodeType(outputNode)) {
      getChildKeys(getNodeType(inputNode)).forEach(childKey => {
        const newKey = key ? `${key}.${childKey}` : childKey;
        if (nodesEqual(inputNode[childKey], outputNode[childKey])) {
          return;
        }
        if (typeof outputNode[childKey] === "undefined" && typeof inputNode[childKey] !== "undefined") {
          this.deleteResults.push(newKey);
          return;
        }
        this.iterateNodes(inputNode[childKey], outputNode[childKey], newKey);
      });
    }
  }
}

export default DeleteConverter;
