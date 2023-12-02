import { Node } from "acorn";
import { BuilderNode } from "../../../../lib/magic/builder";
import RemoveConverter from "../../../../lib/magic/convert-pattern/remove-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("RemoveConverter", () => {
  describe("espree", () => {
    const parser = "espree";

    describe("#call", () => {
      it("generates remove snippet", () => {
        const builderNode = new BuilderNode();
        const converter = new RemoveConverter<Node>(parser, [parseJsByEspree("console.log('hello world')")], [parseJsByEspree("")], builderNode);
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual("remove();");
      });
    });
  });
});