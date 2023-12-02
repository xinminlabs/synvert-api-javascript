import { Node } from "acorn";
import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndInsertConverter from "../../../../lib/magic/convert-pattern/find-and-insert-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("InsertConverter", () => {
  describe("espree", () => {
    const parser = "espree";

    describe("#call", () => {
      it("generates insert snippet for object property", () => {
        const file1 = "code1.js";
        const source1 = `
          assertConvert({
            input,
            output,
            snippet,
          });
        `;
        const file2 = "code2.js";
        const source2 = `
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new FindAndInsertConverter<Node>(
            parser,
            [parseJsByEspree(source1, file1)["body"][0]["expression"]],
            [parseJsByEspree(source2, file2)["body"][0]["expression"]],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`insertAfter('helpers: ["helpers/remove-imports"]', { to: "arguments.0.properties.-1\", at: \"end\", andComma: true });`);
        } finally {
          mock.restore();
        }
      });

      it("generates insert snippet for jsx attribute", () => {
        const file1 = "code1.jsx";
        const source1 = `<Field name="email" type="email" />`;
        const file2 = "code2.jsx";
        const source2 = `<Field name="email" type="email" autoComplete="email" />`;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new FindAndInsertConverter<Node>(
            parser,
            [parseJsByEspree(source1, file1)["body"][0]["expression"]],
            [parseJsByEspree(source2, file2)["body"][0]["expression"]],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`insert('autoComplete="email"', { to: "openingElement.attributes.-1\", at: \"end\", andSpace: true });`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});