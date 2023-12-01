import BaseConverter from "./base-converter";

class NoopConverter<T> extends BaseConverter<T> {
  call() {
    if (this.outputNodes.length === 0) {
      this.builderNode.addConvertPattern("noop();");
    }
  }
}

export default NoopConverter;