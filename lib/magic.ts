import Analyzer from "./magic/analyzer";
import Verifier from "./magic/verifier";

class Magic {
  static call(extension: string, inputs: string[], outputs: string[]): string {
    const snippets = new Analyzer(extension, inputs, outputs).call()
    return snippets.find(snippet => new Verifier(snippet, extension, inputs, outputs).call());
  }
}

export default Magic;
