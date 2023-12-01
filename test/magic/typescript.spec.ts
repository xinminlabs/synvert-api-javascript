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
            group(() => {
              replace("arguments.0", { with: '"mouseleave"' });
              replace("expression", { with: '{{expression.expression}}.on("mouseenter", {{arguments.0}}).on' });
            });
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

      it("gets an insert argument", () => {
        const language = "javascript";
        const inputs = ["newNdoe(type, content, line, column)"];
        const outputs = ["newNdoe(type, content, line, column, token.sourceFile)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: "newNdoe", arguments: { 0: "type", 1: "content", 2: "line", 3: "column", length: 4 } }, () => {
            insert("token.sourceFile", { to: "arguments.-1", at: "end", andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: "newNdoe", arguments: { 0: "type", 1: "content", 2: "line", 3: "column", length: 4 } }, () => {
            replaceWith("{{expression}}({{arguments.0}}, {{arguments.1}}, {{arguments.2}}, {{arguments.3}}, token.sourceFile)");
          });
        `]);
      });

      it("gets a delete argument", () => {
        const language = "javascript";
        const inputs = ["newNdoe(type, content, line, column, token.sourceFile)"];
        const outputs = ["newNdoe(type, content, line, column)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: "newNdoe", arguments: { 0: "type", 1: "content", 2: "line", 3: "column", 4: { nodeType: "PropertyAccessExpression", expression: "token", name: "sourceFile" }, length: 5 } }, () => {
            delete("arguments.-1", { andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: "newNdoe", arguments: { 0: "type", 1: "content", 2: "line", 3: "column", 4: { nodeType: "PropertyAccessExpression", expression: "token", name: "sourceFile" }, length: 5 } }, () => {
            replaceWith("{{expression}}({{arguments.0}}, {{arguments.1}}, {{arguments.2}}, {{arguments.3}})");
          });
        `]);
      });

      it("gets an insert object property", () => {
        const language = "javascript";
        const inputs = [dedent`
          assertConvert({
            input,
            output,
            snippet,
          });
        `];
        const outputs = [dedent`
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: "assertConvert", arguments: { 0: { nodeType: "ObjectLiteralExpression", properties: { 0: { nodeType: "ShorthandPropertyAssignment", name: "input" }, 1: { nodeType: "ShorthandPropertyAssignment", name: "output" }, 2: { nodeType: "ShorthandPropertyAssignment", name: "snippet" }, length: 3 } }, length: 1 } }, () => {
            insertAfter('helpers: ["helpers/remove-imports"]', { to: "arguments.0.properties.-1", at: "end", andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: "assertConvert", arguments: { 0: { nodeType: "ObjectLiteralExpression", properties: { 0: { nodeType: "ShorthandPropertyAssignment", name: "input" }, 1: { nodeType: "ShorthandPropertyAssignment", name: "output" }, 2: { nodeType: "ShorthandPropertyAssignment", name: "snippet" }, length: 3 } }, length: 1 } }, () => {
            replaceWith(\`{{expression}}({
            {{arguments.0.properties.0}},
            {{arguments.0.properties.1}},
            {{arguments.0.properties.2}},
            helpers: ["helpers/remove-imports"],
          })\`);
          });
        `]);
      });

      it("gets an insert jsx property", () => {
        const language = "typescript";
        const inputs = [`<Field name="email" />`];
        const outputs = [`<Field name="email" autoComplete="email" />`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 1 } } }, () => {
            insert('autoComplete="email"', { to: "attributes.properties.-1", at: "end", andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 1 } } }, () => {
            replace("attributes", { with: '{{attributes.properties.0}} autoComplete="email"' });
          });
        `, dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 1 } } }, () => {
            replaceWith('<{{tagName}} {{attributes.properties.0}} autoComplete="email" />');
          });`,
        ]);
      });

      it("gets a delete object property", () => {
        const language = "javascript";
        const inputs = [dedent`
          assertConvert({
            input,
            output,
            snippet,
            helpers: ["helpers/remove-imports"],
          });
        `];
        const outputs = [dedent`
          assertConvert({
            input,
            output,
            snippet,
          });
        `];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", expression: "assertConvert", arguments: { 0: { nodeType: "ObjectLiteralExpression", properties: { 0: { nodeType: "ShorthandPropertyAssignment", name: "input" }, 1: { nodeType: "ShorthandPropertyAssignment", name: "output" }, 2: { nodeType: "ShorthandPropertyAssignment", name: "snippet" }, 3: { nodeType: "PropertyAssignment", name: "helpers", initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral", text: "helpers/remove-imports" }, length: 1 } }, questionToken: undefined }, length: 4 } }, length: 1 } }, () => {
            delete("arguments.0.helpersProperty", { andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: "assertConvert", arguments: { 0: { nodeType: "ObjectLiteralExpression", properties: { 0: { nodeType: "ShorthandPropertyAssignment", name: "input" }, 1: { nodeType: "ShorthandPropertyAssignment", name: "output" }, 2: { nodeType: "ShorthandPropertyAssignment", name: "snippet" }, 3: { nodeType: "PropertyAssignment", name: "helpers", initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral", text: "helpers/remove-imports" }, length: 1 } }, questionToken: undefined }, length: 4 } }, length: 1 } }, () => {
            delete("arguments.0.properties.-1", { andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", expression: "assertConvert", arguments: { 0: { nodeType: "ObjectLiteralExpression", properties: { 0: { nodeType: "ShorthandPropertyAssignment", name: "input" }, 1: { nodeType: "ShorthandPropertyAssignment", name: "output" }, 2: { nodeType: "ShorthandPropertyAssignment", name: "snippet" }, 3: { nodeType: "PropertyAssignment", name: "helpers", initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral", text: "helpers/remove-imports" }, length: 1 } }, questionToken: undefined }, length: 4 } }, length: 1 } }, () => {
            replaceWith(\`{{expression}}({
            {{arguments.0.properties.0}},
            {{arguments.0.properties.1}},
            {{arguments.0.properties.2}},
          })\`);
          });
        `]);
      });

      it("gets a delete jsx property", () => {
        const language = "typescript";
        const inputs = [`<Field name="email" autoComplete="email" />`];
        const outputs = [`<Field name="email" />`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, 1: { nodeType: "JsxAttribute", name: "autoComplete", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 2 } } }, () => {
            delete("attributes.autoCompleteAttribute", { andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, 1: { nodeType: "JsxAttribute", name: "autoComplete", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 2 } } }, () => {
            delete("attributes.properties.-1", { andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, 1: { nodeType: "JsxAttribute", name: "autoComplete", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 2 } } }, () => {
            replace("attributes", { with: "{{attributes.properties.0}}" });
          });
        `, dedent`
          withNode({ nodeType: "JsxSelfClosingElement", tagName: "Field", attributes: { nodeType: "JsxAttributes", properties: { 0: { nodeType: "JsxAttribute", name: "name", initializer: { nodeType: "StringLiteral", text: "email" } }, 1: { nodeType: "JsxAttribute", name: "autoComplete", initializer: { nodeType: "StringLiteral", text: "email" } }, length: 2 } } }, () => {
            replaceWith("<{{tagName}} {{attributes.properties.0}} />");
          });`,
        ]);
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

      it('checks null value', () => {
        const language = "typescript";
        const inputs = ["class Synvert {}"];
        const outputs = ["class Foobar {}"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.nql);
        expect(snippet).toEqual([dedent`
          findNode(\`.ClassDeclaration[name=Synvert][typeParameters=undefined][heritageClauses=undefined]\`, () => {
            replace("name", { with: "Foobar" });
          });
        `, dedent`
          findNode(\`.ClassDeclaration[name=Synvert][typeParameters=undefined][heritageClauses=undefined]\`, () => {
            replaceWith("class Foobar {}");
          });
        `]);
      });
    });
  });
});