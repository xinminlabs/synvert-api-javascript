import dedent from "dedent";
import Analyzer from "../../lib/magic/analyzer";
import { NqlOrRules } from "../../lib/magic/types";

describe("Analyzer", () => {
  describe("#call", () => {
    describe("ts", () => {
      it("gets pattern", () => {
        const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
        const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
        const analyzer = new Analyzer("ts", inputs, outputs, NqlOrRules.rules);
        const expected = dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replaceWith("Array.{{expression.name}}({{arguments.0}})");
          });
        `;
        expect(analyzer.call()).toEqual([expected]);
      });
    });

    describe("tsx", () => {
      it("gets pattern", () => {
        const inputs = [dedent`
          <div className="container-fluid">
          </div>
        `];
        const outputs = [dedent`
          <Container fluid>
          </Container>
        `];
        const analyzer = new Analyzer("tsx", inputs, outputs, NqlOrRules.rules);
        const expected = dedent`
          withNode({ nodeType: "JsxElement", openingElement: { nodeType: "JsxOpeningElement", tagName: "div", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: " className", initializer: { nodeType: "StringLiteral", text: "container-fluid" } }, length: 1 } } }, children: { 0: { nodeType: "JsxText", text: "\n" }, length: 1 }, closingElement: { nodeType: "JsxClosingElement", tagName: "div" } }, () => {
            replaceWith("<Container fluid>{{children.0}}</Container>");
          });
        `;
        expect(analyzer.call()).toEqual([expected]);
      });
    });

    describe("ts type", () => {
      it("gets pattern", () => {
        const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
        const outputs = [`const x: string[] = ['a', 'b'];`, `const y: string[] = ['c', 'd'];`];
        const analyzer = new Analyzer("ts", inputs, outputs, NqlOrRules.rules);
        const expected = dedent`
          withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: " Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
            replaceWith("const{{declarationList.declarations.0.name}}:{{declarationList.declarations.0.type.typeArguments.0}}[] ={{declarationList.declarations.0.initializer}};");
          });
        `;
        expect(analyzer.call()).toEqual([expected]);
      });
    });
  });
});