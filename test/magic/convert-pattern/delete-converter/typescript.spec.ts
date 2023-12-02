import { Node } from "typescript";
import { BuilderNode } from "../../../../lib/magic/builder";
import DeleteConverter from "../../../../lib/magic/convert-pattern/delete-converter";
import { parseJS } from "../../../test-helper";

describe("DeleteConverter", () => {
  describe("typescript", () => {
    const parser = "typescript";

    describe("#call", () => {
      it("generates delete snippet for semicolon", () => {
        const code1 = `
          const someObject = {
            cat: cat,
            dog: dog,
            bird: bird,
          }
        `;
        const code2 = `
          const someObject = {
            cat,
            dog,
            bird,
          }
        `;
        const builderNode = new BuilderNode();
        const converter = new DeleteConverter<Node>(
          parser,
          [parseJS(code1)["declarationList"]["declarations"][0]["initializer"]["properties"][0]],
          [parseJS(code2)["declarationList"]["declarations"][0]["initializer"]["properties"][0]],
          builderNode,
          "name",
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual(`delete(["semicolon", "initializer"]);`);
      });
    });
  });
});
