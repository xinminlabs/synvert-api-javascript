import mock from "mock-fs";
import { Node } from "acorn";
import { BuilderNode } from "../../../../lib/magic/builder";
import InsertConverter from "../../../../lib/magic/convert-pattern/insert-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("InsertConverter", () => {
  describe("espree", () => {
    const parser = "espree";

    describe("#call", () => {
      it("generates insert snippet", () => {
        const file1 = "code1.js";
        const source1 = "";
        const file2 = "code2.js";
        const source2 = "console.log('hello world')"
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new InsertConverter<Node>(parser, [parseJsByEspree(source1, file1)], [parseJsByEspree(source2, file2)], builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`insert("console.log('hello world')", { at: \"beginning\" });`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});