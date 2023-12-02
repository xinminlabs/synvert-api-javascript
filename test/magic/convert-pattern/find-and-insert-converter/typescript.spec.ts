import { Node } from "typescript";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndInsertConverter from "../../../../lib/magic/convert-pattern/find-and-insert-converter";
import { parseJS } from "../../../test-helper";

describe("InsertConverter", () => {
  describe("typescript", () => {
    const parser = "typescript";

    describe("#call", () => {
      it("generates insert snippet for attribute property", () => {
        const builderNode = new BuilderNode();
        const source1 = `
          assertConvert({
            input,
            output,
            snippet,
          });
        `;
        const source2 = `
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `;
        const converter = new FindAndInsertConverter<Node>(
          parser,
          [parseJS(source1)['expression']],
          [parseJS(source2)['expression']],
          builderNode
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual(`insertAfter('helpers: ["helpers/remove-imports"]', { to: "arguments.0.properties.-1", at: "end", andComma: true });`);
      });

      it("generates insert snippet for attribute property", () => {
        const builderNode = new BuilderNode();
        const converter = new FindAndInsertConverter<Node>(
          parser,
          [parseJS(`<Field name="email" type="email" />`)['expression']],
          [parseJS(`<Field name="email" type="email" autoComplete="email" />`)['expression']],
          builderNode
        );
        converter.call();
        expect(builderNode["children"].length).toEqual(1);
        expect(builderNode["children"][0].generateSnippet()).toEqual(`insert('autoComplete="email"', { to: "attributes.properties.-1", at: \"end\", andSpace: true });`);
      });
    });
  });
});