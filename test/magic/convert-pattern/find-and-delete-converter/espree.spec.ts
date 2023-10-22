import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndDeleteConverter from "../../../../lib/magic/convert-pattern/find-and-delete-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("FindAndDeleteConverter", () => {
  describe("#call", () => {
    describe("espree", () => {
      it("generates delete snippet for property", () => {
        const file1 = "code1.js";
        const source1 = `
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `;
        const file2 = "code2.js";
        const source2 = `
          assertConvert({
            input,
            output,
            snippet,
          });
        `;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new FindAndDeleteConverter(
            [parseJsByEspree(source1, file1)["body"][0]["expression"]],
            [parseJsByEspree(source2, file2)["body"][0]["expression"]],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(2);
          expect(builderNode["children"].map(node => node.generateSnippet())).toEqual([
            `delete("arguments.0.helpersProperty", { andComma: true });`,
            `delete("arguments.0.properties.-1", { andComma: true });`,
          ]);
        } finally {
          mock.restore();
        }
      });

      it("generates delete snippet for attribute", () => {
        const file1 = "code1.jsx";
        const source1 = `<Field name="email" type="email" autoComplete="email" />`;
        const file2 = "code2.jsx";
        const source2 = `<Field name="email" type="email" />`;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new FindAndDeleteConverter(
            [parseJsByEspree(source1, file1)["body"][0]["expression"], "code1.jsx"],
            [parseJsByEspree(source2, file2)["body"][0]["expression"], "code2.jsx"],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(2);
          expect(builderNode["children"].map(node => node.generateSnippet())).toEqual([
            `delete("openingElement.autoCompleteAttribute", { andSpace: true });`,
            `delete("openingElement.attributes.-1", { andSpace: true });`,
          ]);
        } finally {
          mock.restore();
        }
      });
    });
  });
});
