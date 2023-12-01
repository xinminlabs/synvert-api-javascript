import BaseConverter from "./base-converter";
import { getChildKeys } from "../utils";

class DeleteConverter<T> extends BaseConverter<T> {
  call() {
    const firstInputNode = this.inputNodes[0];

    const deleteKeys = getChildKeys(firstInputNode).filter(name => {
      return this.name !== name && !!firstInputNode[name];
    });

    this.buildDeletePattern(firstInputNode, deleteKeys, this.builderNode);
  }
}

export default DeleteConverter;
