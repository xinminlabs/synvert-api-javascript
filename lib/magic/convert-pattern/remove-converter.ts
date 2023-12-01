import { nodeIsNull } from "../utils";
import BaseConverter from "./base-converter";

class RemoveConverter<T> extends BaseConverter<T> {
  call() {
    if (this.outputNodes.length > 0 && this.outputNodes.every(node => nodeIsNull(node))) {
      this.builderNode.addConvertPattern("remove();");
    }
  }
}

export default RemoveConverter;