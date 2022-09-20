import BaseConverter from "./base-converter";

class NoopConverter extends BaseConverter {
  call() {
    if (this.outputNodes.length === 0) {
      this.builderNode.addConvertPattern("noop();");
    }
  }
}

export default NoopConverter;