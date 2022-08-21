import debug from "debug";
import Analyzer from "./magic/analyzer";
import { NqlOrRules } from "./magic/types";
import Verifier from "./magic/verifier";

class Magic {
  static call(extension: string, inputs: string[], outputs: string[], nqlOrRules: NqlOrRules): string {
    const snippets = new Analyzer(extension, inputs, outputs, nqlOrRules).call()
    snippets.forEach(snippet => debug("synvert-api:analyzer")(`snippet: ${snippet}`));
    return snippets.find(snippet => new Verifier(snippet, extension, inputs, outputs).call());
  }
}

export default Magic;
