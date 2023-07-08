import dedent from "dedent";
import NodeQuery, { TypescriptAdapter as QueryTypescriptAdapter } from "@xinminlabs/node-query";
import NodeMutation, { TypescriptAdapter as MutationTypescriptAdapter } from "@xinminlabs/node-mutation";
import Analyzer from "../../../lib/magic/analyzer";
import { NqlOrRules } from "../../../lib/magic/types";

describe("Analyzer", () => {
  describe("#call", () => {
    describe("typescript", () => {
      beforeEach(() => {
        NodeQuery.configure({ adapter: new QueryTypescriptAdapter() });
        NodeMutation.configure({ adapter: new MutationTypescriptAdapter() });
      })

      describe("ts", () => {
        it("gets pattern", () => {
          const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
          const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
          const analyzer = new Analyzer("typescript", "typescript", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
                replace("expression.expression", { with: "Array" });
              });
            `,
            dedent`
              withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
                replaceWith("Array.{{expression.name}}({{arguments.0}})");
              });
            `
          ];
          expect(analyzer.call()).toEqual(expected);
        });
      });

      describe("tsx", () => {
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
          const analyzer = new Analyzer("typescript", "typescript", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "JsxElement", openingElement: { nodeType: "JsxOpeningElement", tagName: "div", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "className", initializer: { nodeType: "StringLiteral", text: "container-fluid" } }, length: 1 } } }, children: { 0: "foobar", length: 1 }, closingElement: { nodeType: "JsxClosingElement", tagName: "div" } }, () => {
                replace("closingElement", { with: "</Container>" });
                replace("openingElement", { with: "<Container fluid>" });
              });
            `,
            dedent`
              withNode({ nodeType: "JsxElement", openingElement: { nodeType: "JsxOpeningElement", tagName: "div", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "className", initializer: { nodeType: "StringLiteral", text: "container-fluid" } }, length: 1 } } }, children: { 0: "foobar", length: 1 }, closingElement: { nodeType: "JsxClosingElement", tagName: "div" } }, () => {
                replaceWith(\`<Container fluid>\n  {{children.0}}\n</Container>\`);
              });
            `,
          ]
          expect(analyzer.call()).toEqual(expected);
        });
      });

      describe("ts type", () => {
        it("gets pattern", () => {
          const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
          const outputs = [`const x: string[] = ['a', 'b'];`, `const y: string[] = ['c', 'd'];`];
          const analyzer = new Analyzer("typescript", "typescript", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
                replace("declarationList.declarations.0.type", { with: "{{declarationList.declarations.0.type.typeArguments.0}}[]" });
              });
            `,
            dedent`
              withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
                replaceWith("const {{declarationList.declarations.0.name}}: {{declarationList.declarations.0.type.typeArguments.0}}[] = {{declarationList.declarations.0.initializer}};");
              });
            `
          ]
          expect(analyzer.call()).toEqual(expected);
        });
      });

      describe("ts multiple types", () => {
        it("gets pattern", () => {
          const inputs = [`const x: Array<string | number> = ['a', 'b'];`, `const y: Array<string | number> = ['c', 'd'];`];
          const outputs = [`const x: (string | number)[] = ['a', 'b'];`, `const y: (string | number)[] = ['c', 'd'];`];
          const analyzer = new Analyzer("typescript", "typescript", inputs, outputs, NqlOrRules.rules);
          const expected = [
            dedent`
              withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "UnionType", types: { 0: { nodeType: "StringKeyword" }, 1: { nodeType: "NumberKeyword" }, length: 2 } }, length: 1 } } }, length: 1 } } }, () => {
                replace("declarationList.declarations.0.type", { with: "({{declarationList.declarations.0.type.typeArguments.0}})[]" });
              });
            `,
            dedent`
              withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "UnionType", types: { 0: { nodeType: "StringKeyword" }, 1: { nodeType: "NumberKeyword" }, length: 2 } }, length: 1 } } }, length: 1 } } }, () => {
                replaceWith("const {{declarationList.declarations.0.name}}: ({{declarationList.declarations.0.type.typeArguments.0}})[] = {{declarationList.declarations.0.initializer}};");
              });
            `
          ]
          expect(analyzer.call()).toEqual(expected);
        });
      });
    });
  });
});