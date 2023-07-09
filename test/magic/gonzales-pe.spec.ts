import dedent from "dedent";
import Magic from "../../lib/magic";
import { NqlOrRules } from "../../lib/magic/types";

describe("Magic", () => {
  describe(".call", () => {
    describe("gonzales-pe", () => {
      const language = "css";
      const parser = "gonzales-pe";

      it('gets a css snippet', () => {
        const inputs = ["a { color: red }"];
        const outputs = ["a { color: blue }"];
        const snippet = Magic.call(language, parser, inputs, outputs, NqlOrRules.rules);
        expect(snippet).toEqual([dedent`
          withNode({ nodeType: "ruleset", selector: { nodeType: "selector", typeSelector: { nodeType: "typeSelector", ident: { nodeType: "ident" } } }, space: { nodeType: "space" }, block: { nodeType: "block", space: { nodeType: "space" }, declaration: { nodeType: "declaration", property: { nodeType: "property", ident: { nodeType: "ident" } }, propertyDelimiter: { nodeType: "propertyDelimiter" }, space: { nodeType: "space" }, value: { nodeType: "value", ident: { nodeType: "ident" } } } } }, () => {
            replaceWith("a { color: blue }");
          });
        `]);
      });
    });
  });
});