import dedent from "dedent";
import Magic from "../../lib/magic";
import { NqlOrRules } from "../../lib/magic/types";

describe("Magic", () => {
  describe(".call", () => {
    describe("espree", () => {
      const language = "javascript";
      const parser = "espree";

      it('gets a js snippet', () => {
        const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
        const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replace("callee.object", { with: "Array" });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            replaceWith("Array.{{callee.property}}({{arguments.0}})");
          });
        `]);
      });

      it("gets a replaceWith", () => {
        const inputs = [`$this.hover(fn1, fn2)`];
        const outputs = [`$this.on("mouseenter", fn1).on("mouseleave", fn2)`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$this", property: "hover" }, arguments: { 0: "fn1", 1: "fn2", length: 2 } }, () => {
            group(() => {
              replace("arguments.0", { with: '"mouseleave"' });
              replace("callee", { with: '{{callee.object}}.on("mouseenter", {{arguments.0}}).on' });
            });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$this", property: "hover" }, arguments: { 0: "fn1", 1: "fn2", length: 2 } }, () => {
            replaceWith('{{callee.object}}.on("mouseenter", {{arguments.0}}).on("mouseleave", {{arguments.1}})');
          });
        `]);
      });

      it("gets a remove", () => {
        const inputs = [`console.log("hello world")`];
        const outputs = [""];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "console", property: "log" }, arguments: { 0: { nodeType: "Literal" }, length: 1 } }, () => {
            remove();
          });
        `]);
      });

      it("gets an insert", () => {
        const inputs = [""];
        const outputs = ["console.log('hello world')"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([`insert("console.log('hello world')", { at: "beginning" });`]);
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
          withNode({ nodeType: "CallExpression", callee: "assertConvert", arguments: { 0: { nodeType: "ObjectExpression", properties: { 0: { nodeType: "Property", key: "input", value: "input" }, 1: { nodeType: "Property", key: "output", value: "output" }, 2: { nodeType: "Property", key: "snippet", value: "snippet" }, length: 3 } }, length: 1 } }, () => {
            insertAfter('helpers: ["helpers/remove-imports"]', { to: "arguments.0.properties.-1", at: "end", andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", callee: "assertConvert", arguments: { 0: { nodeType: "ObjectExpression", properties: { 0: { nodeType: "Property", key: "input", value: "input" }, 1: { nodeType: "Property", key: "output", value: "output" }, 2: { nodeType: "Property", key: "snippet", value: "snippet" }, length: 3 } }, length: 1 } }, () => {
            replaceWith(\`{{callee}}({
            {{arguments.0.properties.0}},
            {{arguments.0.properties.1}},
            {{arguments.0.properties.2}},
            helpers: ["helpers/remove-imports"],
          })\`);
          });
        `]);
      });

      it("gets an insert jsx property", () => {
        const language = "javascript";
        const inputs = [`<Field name="email" />`];
        const outputs = [`<Field name="email" autoComplete="email" />`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 1 } }, children: { length: 0 }, closingElement: null }, () => {
            insert('autoComplete="email"', { to: "openingElement.attributes.-1", at: "end", andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 1 } }, children: { length: 0 }, closingElement: null }, () => {
            replaceWith('<{{openingElement.name}} {{openingElement.attributes.0}} autoComplete="email" />');
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
          withNode({ nodeType: "CallExpression", callee: "assertConvert", arguments: { 0: { nodeType: "ObjectExpression", properties: { 0: { nodeType: "Property", key: "input", value: "input" }, 1: { nodeType: "Property", key: "output", value: "output" }, 2: { nodeType: "Property", key: "snippet", value: "snippet" }, 3: { nodeType: "Property", key: "helpers", value: { nodeType: "ArrayExpression", elements: { 0: { nodeType: "Literal" }, length: 1 } } }, length: 4 } }, length: 1 } }, () => {
            delete("arguments.0.helpersProperty", { andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", callee: "assertConvert", arguments: { 0: { nodeType: "ObjectExpression", properties: { 0: { nodeType: "Property", key: "input", value: "input" }, 1: { nodeType: "Property", key: "output", value: "output" }, 2: { nodeType: "Property", key: "snippet", value: "snippet" }, 3: { nodeType: "Property", key: "helpers", value: { nodeType: "ArrayExpression", elements: { 0: { nodeType: "Literal" }, length: 1 } } }, length: 4 } }, length: 1 } }, () => {
            delete("arguments.0.properties.-1", { andComma: true });
          });
        `, dedent`
          withNode({ nodeType: "CallExpression", callee: "assertConvert", arguments: { 0: { nodeType: "ObjectExpression", properties: { 0: { nodeType: "Property", key: "input", value: "input" }, 1: { nodeType: "Property", key: "output", value: "output" }, 2: { nodeType: "Property", key: "snippet", value: "snippet" }, 3: { nodeType: "Property", key: "helpers", value: { nodeType: "ArrayExpression", elements: { 0: { nodeType: "Literal" }, length: 1 } } }, length: 4 } }, length: 1 } }, () => {
            replaceWith(\`{{callee}}({
            {{arguments.0.properties.0}},
            {{arguments.0.properties.1}},
            {{arguments.0.properties.2}},
          })\`);
          });
        `]);
      });

      it("gets a delete jsx property", () => {
        const language = "javascript";
        const inputs = [`<Field name="email" autoComplete="email" />`];
        const outputs = [`<Field name="email" />`];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, 1: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 2 } }, children: { length: 0 }, closingElement: null }, () => {
            delete("openingElement.autoCompleteAttribute", { andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, 1: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 2 } }, children: { length: 0 }, closingElement: null }, () => {
            delete("openingElement.attributes.-1", { andSpace: true });
          });
        `, dedent`
          withNode({ nodeType: "JSXElement", openingElement: { nodeType: "JSXOpeningElement", name: { nodeType: "JSXIdentifier" }, attributes: { 0: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, 1: { nodeType: "JSXAttribute", name: { nodeType: "JSXIdentifier" }, value: { nodeType: "Literal" } }, length: 2 } }, children: { length: 0 }, closingElement: null }, () => {
            replaceWith("<{{openingElement.name}} {{openingElement.attributes.0}} />");
          });`,
        ]);
      });

      it('gets a snippet with empty string', () => {
        const inputs = ["string.split('')", "str.split('')"];
        const outputs = ["[...string]", "[...str]"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.nql);
        expect(snippet).toEqual([dedent`
          findNode(\`.CallExpression[callee=.MemberExpression[object=.Identifier][property=split]][arguments.length=1][arguments.0=.Literal]\`, () => {
            replaceWith("[...{{callee.object}}]");
          });
        `]);
      });

      it('checks null value', () => {
        const inputs = ["class Synvert {}"];
        const outputs = ["class Foobar {}"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.nql);
        expect(snippet).toEqual([dedent`
          findNode(\`.ClassDeclaration[id=Synvert][superClass=null][body=.ClassBody]\`, () => {
            replace("id", { with: "Foobar" });
          });
        `, dedent`
          findNode(\`.ClassDeclaration[id=Synvert][superClass=null][body=.ClassBody]\`, () => {
            replaceWith("class Foobar {{body}}");
          });
        `]);
      });
    });
  });
});