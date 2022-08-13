import fs from "fs";
import mock from "mock-fs";
import { getFileName } from "./utils";

class Verifier {
  constructor(private snippet: string, private extension: string, private inputs: string[], private outputs: string[]) { }

  call(): boolean {
    try {
      return this.inputs.every((input, index) => {
        const fileName = getFileName(this.extension);
        const snippet = `
          const Synvert = require("synvert-core");
          new Synvert.Rewriter("group", "name", () => {
            configure({ parser: 'typescript' });
            withinFile("${fileName}", () => {
              ${this.snippet}
            });
          });
        `;
        const rewriter = eval(snippet);
        mock({ [fileName]: input });
        rewriter.process();
        return fs.readFileSync(fileName, "utf-8") == this.outputs[index];
      });
    } finally {
      mock.restore();
    }
  }
}

export default Verifier;