import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndDeleteConverter from "../../../../lib/magic/convert-pattern/find-and-delete-converter";
import { parseJS } from "../../../test-helper";

describe("FindAndDeleteConverter", () => {
  describe("#call", () => {
    describe("typescript", () => {
      it("generates delete snippet for property", () => {
        const builderNode = new BuilderNode();
        const source1 = `
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `;
        const source2 = `
          assertConvert({
            input,
            output,
            snippet,
          });
        `;
        const converter = new FindAndDeleteConverter(
          [parseJS(source1)['expression']],
          [parseJS(source2)['expression']],
          builderNode
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(2);
        expect(builderNode["children"].map(node => node.generateSnippet())).toEqual([
          `delete("arguments.0.helpersProperty", { andComma: true });`,
          `delete("arguments.0.properties.-1", { andComma: true });`,
        ]);
      });

      it("generates delete snippet for attribute", () => {
        const builderNode = new BuilderNode();
        const converter = new FindAndDeleteConverter(
          [parseJS(`<Field name="email" type="email" autoComplete="email" />`)['expression']],
          [parseJS(`<Field name="email" type="email" />`)['expression']],
          builderNode
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(2);
        expect(builderNode["children"].map(node => node.generateSnippet())).toEqual([
          `delete("attributes.autoCompleteAttribute", { andSpace: true });`,
          `delete("attributes.properties.-1", { andSpace: true });`,
        ]);
      });
    });
  });
});
