import { BuilderNode } from "../../../lib/magic/builder";
import DeleteConverter from "../../../lib/magic/convert-pattern/delete-converter";
import { parseJS } from "../../test-helper";

describe("DeleteConverter", () => {
  describe("#call", () => {
    it("generates delete snippet", () => {
      const builderNode = new BuilderNode();
      const converter = new DeleteConverter(
        [parseJS(`<Field name="email" type="email" autoComplete="email" />`)['expression']],
        [parseJS(`<Field name="email" type="email" />`)['expression']],
        builderNode
      );
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`deleteNode("attributes.properties.-1");`);
    })
  });
});
