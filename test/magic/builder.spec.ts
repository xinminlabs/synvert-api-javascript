import Builder from "../../lib/magic/builder";

describe("Builder", () => {
  describe("#addWithNodePattern", () => {
    it("returns withNode", () => {
      const snippets = Builder.build((builderNode) => {
        builderNode.addWithFundPattern({ key1: 'value1', key2: 'value2 '}, () => {});
      });
      const expected = `withNode({ key1: "value1", key2: "value2 " }, () => {\n});`;
      expect(snippets).toEqual([expected]);
    });
  });
});