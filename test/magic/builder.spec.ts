import dedent from "dedent";
import Builder from "../../lib/magic/builder";

describe("Builder", () => {
  describe("#addFindNodePattern", () => {
    it("returns findNode", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addFindNodeFindPattern({
          nodeType: "CallExpression",
          expression: {
            expression: "$",
            name: "isArray",
            nodeType: "PropertyAccessExpression",
          },
          arguments: {
            length: 1,
            0: {
              nodeType: "Identifier"
            }
          }
        }, () => {});
      });
      const expected = "findNode(`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.0=.Identifier][arguments.length=1]`, () => {\n});";
      expect(snippets).toEqual([expected]);
    });
  });

  describe("#addWithNodePattern", () => {
    it("returns withNode", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addWithNodeFindPattern({
          nodeType: "CallExpression",
          expression: {
            expression: "$",
            name: "isArray",
            nodeType: "PropertyAccessExpression",
          },
          arguments: {
            length: 1,
            0: {
              nodeType: "Identifier"
            }
          }
        }, () => {});
      });
      const expected = `withNode({ nodeType: "CallExpression", expression: { expression: "$", name: "isArray", nodeType: "PropertyAccessExpression" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {\n});`;
      expect(snippets).toEqual([expected]);
    });
  });

  describe("#addConvertPattern", () => {
    it("returns pattern", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addConvertPattern(`replaceWith("jQuery.{{expression.expression.name}}");`);
      });
      const expected = `replaceWith("jQuery.{{expression.expression.name}}");`;
      expect(snippets).toEqual([expected]);
    });
  });

  describe("composition", () => {
    it("gets patterns", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addWithNodeFindPattern({ key1: 'value1', key2: 'value2'}, (findNode) => {
          findNode.addConvertPattern(`replaceWith("jQuery.{{expression.expression.name}}");`);
        });
      });
      const expected = dedent`
        withNode({ key1: "value1", key2: "value2" }, () => {
          replaceWith("jQuery.{{expression.expression.name}}");
        });
      `;
      expect(snippets).toEqual([expected]);
    });
  });

  describe("#addSelective", () => {
    it("gets patterns", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addWithNodeFindPattern({ key1: 'value1', key2: 'value2'}, (findNode) => {
          findNode.addSelective((selectiveNode) => {
            selectiveNode.addConvertPattern(`replaceWith("$.{{expression.expression.name}}");`);
          });
          findNode.addSelective((selectiveNode) => {
            selectiveNode.addConvertPattern(`replaceWith("jQuery.{{expression.expression.name}}");`);
          })
        });
      });
      const snippet1 = dedent`
        withNode({ key1: "value1", key2: "value2" }, () => {
          replaceWith("$.{{expression.expression.name}}");
        });
      `;
      const snippet2 = dedent`
        withNode({ key1: "value1", key2: "value2" }, () => {
          replaceWith("jQuery.{{expression.expression.name}}");
        });
      `;
      expect(snippets).toEqual([snippet1, snippet2]);
    });
  });
});