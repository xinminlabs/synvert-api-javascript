import { escapeString } from "../utils";
import BaseConverter from "./base-converter";

class InsertConverter extends BaseConverter {
  call() {
    if (this.inputNodes.every(node => typeof node === "undefined")) {
      const outputSource = escapeString(this.outputNodes[0].getFullText());
      this.builderNode.addConvertPattern(`insert(${outputSource}, { at: "beginning" });`);
    }
  }
}

export default InsertConverter;
