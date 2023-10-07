import { BuilderNode } from "../../../../lib/magic/builder";
import InsertConverter from "../../../../lib/magic/convert-pattern/insert-converter";
import { parseJS } from "../../../test-helper";

describe("InsertConverter", () => {
  describe("#call", () => {
    describe("typescript", () => {
      it("generates insert snippet", () => {
        const builderNode = new BuilderNode();
        const converter = new InsertConverter([parseJS("")], [parseJS("console.log('hello world')")], builderNode);
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual(`insert("console.log('hello world')", { at: \"beginning\" });`);
      });

      it("generates insert snippet for missing part", () => {
        const builderNode = new BuilderNode();
        const converter = new InsertConverter(
          [parseJS(`<Field name="email" type="email" />`)['expression']],
          [parseJS(`<Field name="email" type="email" autoComplete="email" />`)['expression']],
          builderNode
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual(`insert(' autoComplete="email"', { to: "attributes.properties.-1", at: \"end\" });`);
      });
    });
  });
});