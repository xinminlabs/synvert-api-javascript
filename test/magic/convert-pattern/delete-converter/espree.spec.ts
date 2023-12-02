import mock from "mock-fs";
import { Node } from "acorn";
import { BuilderNode } from "../../../../lib/magic/builder";
import DeleteConverter from "../../../../lib/magic/convert-pattern/delete-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("DeleteConverter", () => {
  describe("espree", () => {
    const parser = "espree";

    describe("#call", () => {
      it("generates delete snippet for semicolon", () => {
        const file1 = "code1.js";
        const code1 = `
          const someObject = {
            cat: cat,
            dog: dog,
            bird: bird,
          }
        `;
        const file2 = "code2.js";
        const code2 = `
          const someObject = {
            cat,
            dog,
            bird,
          }
        `;
        try {
          mock({ [file1]: code1, [file2]: code1 });
          const builderNode = new BuilderNode();
          const converter = new DeleteConverter<Node>(
            parser,
            [parseJsByEspree(code1, file1)["body"][0]["declarations"][0]["init"]["properties"][0], "code1.js"],
            [parseJsByEspree(code2, file2)["body"][0]["declarations"][0]["init"]["properties"][0], "code2.js"],
            builderNode,
            "key",
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`delete(["semicolon", "value"]);`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});
