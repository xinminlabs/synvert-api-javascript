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
            replace("arguments.0", { with: '"mouseleave"' });
            replace("callee", { with: '{{callee.object}}.on("mouseenter", {{arguments.0}}).on' });
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
    });
  });
});