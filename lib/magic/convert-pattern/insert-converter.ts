import BaseConverter from "./base-converter";
import { escapeString, nodeIsNull, getNodeSource } from "../utils";

class InsertConverter<T> extends BaseConverter<T> {
  call() {
    if (this.inputNodes.every(node => nodeIsNull(node)) && this.outputNodes.every(node => !nodeIsNull(node))) {
      const outputSource = escapeString(getNodeSource(this.outputNodes[0]));
      this.builderNode.addConvertPattern(`insert(${outputSource}, { at: "beginning" });`);
      return;
    }
  }
}

export default InsertConverter;
