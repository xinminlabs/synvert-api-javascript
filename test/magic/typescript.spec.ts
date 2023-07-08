import dedent from "dedent";
import Magic from "../../lib/magic";
import { NqlOrRules } from "../../lib/magic/types";

describe("Magic", () => {
  describe(".call", () => {
    describe("typescript", () => {
      const parser = "typescript";

      it('gets a js snippet', () => {
        const language = "javascript";
        const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
        const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replace("expression.expression", { with: "Array" });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replaceWith("Array.{{expression.name}}({{arguments.0}})");
          });
        `]);
      });

      it('gets a ts snippet with rules', () => {
        const language = "typescript";
        const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
        const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replace("expression.expression", { with: "Array" });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replaceWith("Array.{{expression.name}}({{arguments.0}})");
          });
        `]);
      });

      it('gets a ts snippet with nql', () => {
        const language = "typescript";
        const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
        const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.nql);
        expect(snippet).toEqual([dedent`
          findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
            replace("expression.expression", { with: "Array" });
          });
        `, dedent`
          findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
            replaceWith("Array.{{expression.name}}({{arguments.0}})");
          });
        `]);
      });

      it("gets ts type", () => {
        const language = "typescript";
        const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
        const outputs = [`const x: string[] = ['a', 'b'];`, `const y: string[] = ['c', 'd'];`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
            replace("declarationList.declarations.0.type", { with: "{{declarationList.declarations.0.type.typeArguments.0}}[]" });
          });
        `, dedent`
          withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
            replaceWith("const {{declarationList.declarations.0.name}}: {{declarationList.declarations.0.type.typeArguments.0}}[] = {{declarationList.declarations.0.initializer}};");
          });
        `]);
      });

      it("gets a replaceWith", () => {
        const language = "javascript";
        const inputs = [`$this.hover(fn1, fn2)`];
        const outputs = [`$this.on("mouseenter", fn1).on("mouseleave", fn2)`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$this", name: "hover" }, arguments: { 0: "fn1", 1: "fn2", length: 2 } }, () => {
            replace("arguments.0", { with: '"mouseleave"' });
            replace("expression", { with: '{{expression.expression}}.on("mouseenter", {{arguments.0}}).on' });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$this", name: "hover" }, arguments: { 0: "fn1", 1: "fn2", length: 2 } }, () => {
            replaceWith('{{expression.expression}}.on("mouseenter", {{arguments.0}}).on("mouseleave", {{arguments.1}})');
          });
        `]);
      });

      it("gets a noop", () => {
        const language = "typescript";
        const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
        const snippet = Magic.call(language, parser, inputs, [], NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
            noop();
          });
        `]);
      });

      it("gets a remove", () => {
        const language = "typescript";
        const inputs = [`console.log("hello world")`];
        const outputs = [""];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "console", name: "log" }, arguments: { 0: { nodeType: "StringLiteral", text: "hello world" }, length: 1 } }, () => {
            remove();
          });
        `]);
      });

      it("gets an insert", () => {
        const language = "typescript";
        const inputs = [""];
        const outputs = ["console.log('hello world')"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([`insert("console.log('hello world')", { at: "beginning" });`]);
      });

      it('gets a snippet with empty string', () => {
        const language = "typescript";
        const inputs = ["string.split('')", "str.split('')"];
        const outputs = ["[...string]", "[...str]"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.nql);
        expect(snippet).toEqual([dedent`
          findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=.Identifier][name=split]][arguments.length=1][arguments.0=.StringLiteral[text=""]]\`, () => {
            replaceWith("[...{{expression.expression}}]");
          });
        `]);
      });
    });
  });
});