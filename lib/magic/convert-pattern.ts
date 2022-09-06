import { ConvertPatternOptions } from "./types";
import FindAndReplaceConverter from "./convert-pattern/find-and-replace-converter"
import FindAndReplaceWithConverter from "./convert-pattern/find-and-replace-with-converter"

const PATTERNS = {
  findAndReplace: FindAndReplaceConverter,
  findAndReplaceWith: FindAndReplaceWithConverter,
}

class ConvertPattern {
  constructor(private options: ConvertPatternOptions) {}

  call() {
    const { inputNodes, outputNodes, builderNode, converterType } = this.options;
    new PATTERNS[converterType](inputNodes, outputNodes, builderNode).call();
  }
}

export default ConvertPattern;