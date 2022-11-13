import { BuilderNode } from "../../../lib/magic/builder";
import InsertConverter from "../../../lib/magic/convert-pattern/insert-converter";
import { parseJS } from "../../test-helper";

describe("InsertConverter", () => {
  describe("#call", () => {
    it("generates insert snippet", () => {
      const builderNode = new BuilderNode();
      const converter = new InsertConverter([parseJS("")], [parseJS("console.log('hello world')")], builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`insert("console.log('hello world')", { at: \"beginning\" });`);
    });
  });
});