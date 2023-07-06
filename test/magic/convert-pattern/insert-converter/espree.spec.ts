import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import InsertConverter from "../../../../lib/magic/convert-pattern/insert-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("InsertConverter", () => {
  describe("#call", () => {
    describe("espree", () => {
      it("generates insert snippet", () => {
        const file1 = "code1.js";
        const source1 = "";
        const file2 = "code2.js";
        const source2 = "console.log('hello world')"
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new InsertConverter([parseJsByEspree(source1, file1)], [parseJsByEspree(source2, file2)], builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`insert("console.log('hello world')", { at: \"beginning\" });`);
        } finally {
          mock.restore();
        }
      });

      it("generates insert snippet for missing part", () => {
        const file1 = "code1.jsx";
        const source1 = `<Field name="email" type="email" />`;
        const file2 = "code2.jsx";
        const source2 = `<Field name="email" type="email" autoComplete="email" />`;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new InsertConverter(
            [parseJsByEspree(source1, file1)["body"][0]["expression"]],
            [parseJsByEspree(source2, file2)["body"][0]["expression"]],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`insert('autoComplete="email"', { to: "openingElement.attributes.-1\", at: \"end\" });`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});