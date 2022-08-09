import { Node } from "typescript";
import BaseConverter from "./base-converter";
import  FakeNode from "../fake-node";
import { getNodeType, visitorKeys, nodesEqual, isNode } from "../utils";

class FindAndReplaceConverter extends BaseConverter {
  call() {
    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];

    const replacedNode = this.replaceNode(firstOutputNode, firstInputNode);
    const newStr = this.generateSourceCode(replacedNode);
    this.builderNode.addConvertPattern(`replaceWith("${newStr}");`);
  }

  private replaceNode(replacedNode: Node | FakeNode, inputNode: Node | Node[], key?: string): Node | FakeNode {
    if (Array.isArray(inputNode)) {
      inputNode.forEach((inputChildNode, index) => {
        if (!(replacedNode instanceof FakeNode)) {
          const [found, result] = this.findAndReplace(replacedNode, inputChildNode, [key, index].join("."));
          if (found) {
            replacedNode = result;
          }
        }
      });
    } else if (isNode(inputNode)) {
      visitorKeys[getNodeType(inputNode)].forEach(childKey => {
        if (!(replacedNode instanceof FakeNode) && inputNode[childKey]) {
          const [found, result] = this.findAndReplace(replacedNode, inputNode[childKey], [key, childKey].join("."));
          if (found) {
            replacedNode = result;
          } else {
            replacedNode = this.replaceNode(replacedNode, inputNode[childKey], childKey);
          }
        }
      });
    }
    return replacedNode;
  }

  private findAndReplace(replacedNode: Node, targetNode: Node, fakeNodeName: string): [boolean, FakeNode | Node | null] {
    const fakeNode = new FakeNode(`{{${fakeNodeName}}}`);
    if (nodesEqual(replacedNode, targetNode)) {
      fakeNode.range = { start: targetNode.getFullStart(), end: targetNode.getEnd() };
      return [true, fakeNode];
    }
    const names = this.findNames(replacedNode, targetNode)
    if (names.length > 0) {
      return [true, this.deepUpdated(replacedNode, names, fakeNode)];
    }
    return [false, null];
  }

  private findNames(node: Node | Node[], targetNode: Node): string[] {
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index++) {
        if (nodesEqual(node[index], targetNode)) {
          return [String(index)];
        }
      };
    }

    if (!isNode(node)) {
      return [];
    }

    for (let key of visitorKeys[getNodeType(node)]) {
      if (nodesEqual(node[key], targetNode)) {
        return [key];
      }

      const childNames = this.findNames(node[key], targetNode);
      if (childNames.length > 0) {
        return [key, ...childNames];
      }
    };
    return [];
  }

  private deepUpdated(node: Node, names: string[], fakeNode: FakeNode): Node {
    const name = names.shift();
    if (names.length == 0) {
      fakeNode.range = { start: node[name].getFullStart(), end: node[name].getEnd() };
      node[name] = fakeNode;
    } else {
      node[name] = this.deepUpdated(node[name], names, fakeNode);
    }
    return node;
  }

  private generateSourceCode(node: Node | FakeNode, start = 0): string {
    if (node instanceof FakeNode) {
      return node.name;
    }

    let sourceCode = node.getFullText();
    this.getAllFakeNodes(node).reverse().forEach(fakeNode => {
      sourceCode = sourceCode.substring(0, fakeNode.range.start - start) + fakeNode.name + sourceCode.substring(fakeNode.range.end - start);
    });
    return sourceCode;
  }

  private getAllFakeNodes(node: Node | FakeNode): FakeNode[] {
    const fakeNodes = [];
    if (node instanceof FakeNode) {
      fakeNodes.push(node);
    } else {
      node.forEachChild(childNode => {
        fakeNodes.push(...this.getAllFakeNodes(childNode));
      })
    }
    return fakeNodes;
  }
}

export default FindAndReplaceConverter;