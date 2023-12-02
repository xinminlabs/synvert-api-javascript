import dedent from "dedent";
import Analyzer from "../../../lib/magic/analyzer";
import { NqlOrRules } from "../../../lib/magic/types";

describe("Analyzer", () => {
  describe("#call", () => {
    describe("espree", () => {
      describe("js", () => {
        it("gets pattern", () => {
          const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
          const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
          const analyzer = new Analyzer("javascript", "espree", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
                replace("callee.object", { with: "Array" });
              });
            `,
            dedent`
              withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
                replaceWith("Array.{{callee.property}}({{arguments.0}})");
              });
            `
          ];
          expect(analyzer.call()).toEqual(expected);
        });
      });

      describe("jsx", () => {
        it("gets pattern", () => {
          const inputs = [dedent`
            <div className="container-fluid">
              foobar
            </div>
          `];
          const outputs = [dedent`
            <Container fluid>
              foobar
            </Container>
          `];
          const analyzer = new Analyzer("javascript", "espree", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 1 } }, children: { 0: { nodeType: "JSXText" }, length: 1 }, closingElement: { nodeType: "JSXClosingElement", name: { nodeType: "JSXIdentifier" } } }, () => {
                delete("openingElement.attributes.0.value");
              });
            `,
            dedent`
              withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 1 } }, children: { 0: { nodeType: "JSXText" }, length: 1 }, closingElement: { nodeType: "JSXClosingElement", name: { nodeType: "JSXIdentifier" } } }, () => {
                group(() => {
                  replace("closingElement", { with: "</Container>" });
                  replace("openingElement", { with: "<Container fluid>" });
                });
              });
            `,
            dedent`
              withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 1 } }, children: { 0: { nodeType: "JSXText" }, length: 1 }, closingElement: { nodeType: "JSXClosingElement", name: { nodeType: "JSXIdentifier" } } }, () => {
                replaceWith("<Container fluid>{{children.0}}</Container>");
              });
            `,
          ]
          expect(analyzer.call()).toEqual(expected);
        });
      });
    });
  });
});