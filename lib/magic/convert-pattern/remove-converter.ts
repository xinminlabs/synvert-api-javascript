import BaseConverter from "./base-converter";

class RemoveConverter extends BaseConverter {
  call() {
    if (this.outputNodes.every(node => typeof node === "undefined")) {
      this.builderNode.addConvertPattern("remove();");
    }
  }
}

export default RemoveConverter;