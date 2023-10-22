import { ConvertPatternOptions } from "./types";
import FindAndDeleteConverter from "./convert-pattern/find-and-delete-converter";
import FindAndInsertConverter from "./convert-pattern/find-and-insert-converter";
import FindAndReplaceConverter from "./convert-pattern/find-and-replace-converter"
import FindAndReplaceWithConverter from "./convert-pattern/find-and-replace-with-converter"
import NoopConverter from "./convert-pattern/noop-converter";
import RemoveConverter from "./convert-pattern/remove-converter";
import InsertConverter from "./convert-pattern/insert-converter";
import DeleteConverter from "./convert-pattern/delete-converter";

export const PATTERNS = {
  noop: NoopConverter,
  remove: RemoveConverter,
  insert: InsertConverter,
  // delete: DeleteConverter,
  findAndDelete: FindAndDeleteConverter,
  findAndInsert: FindAndInsertConverter,
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