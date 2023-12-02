import { Node } from "typescript";
import { BuilderNode } from "../../../../lib/magic/builder";
import RemoveConverter from "../../../../lib/magic/convert-pattern/remove-converter";
import { parseJS } from "../../../test-helper";

describe("RemoveConverter", () => {
  describe("typescript", () => {
    const parser = "typescript";

    describe("#call", () => {
      it("generates remove snippet", () => {
        const builderNode = new BuilderNode();
        const converter = new RemoveConverter<Node>(parser, [parseJS("console.log('hello world')")], [parseJS("")], builderNode);
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual("remove();");
      });
    });
  });
});