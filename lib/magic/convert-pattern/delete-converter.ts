import BaseConverter from "./base-converter";
import { getChildKeys, getNodeType } from "../utils";

class DeleteConverter extends BaseConverter {
  call() {
    const firstInputNode = this.inputNodes[0];

    const deleteKeys = getChildKeys(firstInputNode).filter(name => {
      return this.name !== name && !!firstInputNode[name];
    });

    this.buildDeletePattern(firstInputNode, deleteKeys, this.builderNode);
  }
}

export default DeleteConverter;
