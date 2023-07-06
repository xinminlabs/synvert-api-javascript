import { BuilderNode } from "../../../../lib/magic/builder";
import RemoveConverter from "../../../../lib/magic/convert-pattern/remove-converter";
import { parseJS } from "../../../test-helper";

describe("RemoveConverter", () => {
  describe("#call", () => {
    describe("typescript", () => {
      it("generates remove snippet", () => {
        const builderNode = new BuilderNode();
        const converter = new RemoveConverter([parseJS("console.log('hello world')")], [parseJS("")], builderNode);
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual("remove();");
      });
    });
  });
});