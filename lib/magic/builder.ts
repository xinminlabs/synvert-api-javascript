import { ignoredAttribute } from "./utils";

class Builder {
  public root: RootNode;

  static build(func: (BuilderNode) => void): string[] {
    const builder = new Builder();
    func.call(this, builder.root)
    return builder.generateSnippets();
  }

  constructor() {
    this.root = new RootNode();
  }

  generateSnippets(): string[] {
    const snippets = [];
    snippets.push(this.root.generateSnippet());
    while(this.root.hasUnselectedChild()) {
      snippets.push(this.root.generateSnippet());
    }
    return snippets.filter(snippet => snippet.length > 0);
  }
}

export class BuilderNode {
  protected level: number;
  protected children: BuilderNode[];
  protected selected: boolean;

  constructor() {
    this.children = [];
    this.selected = true;
  }

  addFindNodeFindPattern(attributes: { [key: string]: object }, func: (BuilderNode) => void): void {
    const node = new FindPatternFindNode(attributes, this.level + 1)
    func.call(this, node);
    this.addNode(node);
  }

  addWithNodeFindPattern(attributes: { [key: string]: object }, func: (BuilderNode) => void): void {
    const node = new FindPatternWithNode(attributes, this.level + 1)
    func.call(this, node);
    this.addNode(node);
  }

  addConvertPattern(pattern: string): void {
    const node = new ConvertPatternNode(pattern, this.level + 1);
    this.addNode(node);
  }

  addSelective(func: (BuilderNode) => void): void {
    const node = new SelectiveNode(this.level);
    func.call(this, node);
    this.addNode(node);
  }

  generateSnippet(): string {
    return "";
  }

  generateChildrenPattern(): string {
    if (this.children.some(child => child instanceof SelectiveNode)) {
      const child = this.children.find(child => ((child.selected && child.hasUnselectedChild()) || !child.selected) && child.isActive());
      if (child) {
        return child.generateSnippet();
      }
      return "";
    }
    return this.children.map(childNode => childNode.generateSnippet()).join("\n");
  }

  hasUnselectedChild(): boolean {
    return this.children.some((child) =>
      (((child instanceof SelectiveNode) && !child.selected) || child.hasUnselectedChild()) && child.isActive()
    );
  }

  protected patternIndent(): number {
    return this.level > 0 ? 2 : 0;
  }

  private addNode(node: BuilderNode): void {
    this.children.push(node);
  }

  private isActive(): boolean {
    return this.children.some((child) => ((child instanceof ConvertPatternNode) && !child.isEmpty()) || child.isActive())
  }
}

class RootNode extends BuilderNode {
  constructor() {
    super();
    this.level = -1;
  }

  generateSnippet(): string {
    return this.generateChildrenPattern();
  }
}

class FindPatternFindNode extends BuilderNode {
  constructor(private attributes: object, level: number) {
    super();
    this.attributes = attributes;
    this.level = level;
  }

  generateSnippet(): string {
    const pattern = this.generateAttributesPattern(this.attributes);
    const result = [];
    result.push(`findNode(\`${pattern}\`, () => {`);
    const childrenPattern = this.generateChildrenPattern();
    if (childrenPattern) {
      result.push(childrenPattern);
    }
    result.push(`});`);
    return result.map(line => " ".repeat(this.patternIndent()) + line).join("\n");
  }

  private generateAttributesPattern(attributes: object): string {
    const nqlArray = [];
    if (attributes["nodeType"]) {
      nqlArray.push(`.${attributes["nodeType"]}`);
    }
    Object.keys(attributes).forEach(key => {
      const value = attributes[key];
      if (key === "nodeType") {
        // skip
      } else if (ignoredAttribute(key, value)) {
        // skip
      } else if (typeof value === "object") {
        if (value["nodeType"]) {
          nqlArray.push(`[${key}=${this.generateAttributesPattern(value)}]`);
        } else {
          if (value["length"]) {
            nqlArray.push(`[${key}.length=${value["length"]}]`);
            delete value["length"];
          }
          Object.keys(value).forEach(nestedKey => {
            if (ignoredAttribute(nestedKey, value[nestedKey])) {
              // skip
            } else if (value[nestedKey]["nodeType"]) {
              nqlArray.push(`[${key}.${nestedKey}=${this.generateAttributesPattern(value[nestedKey])}]`);
            } else {
              nqlArray.push(`[${key}.${nestedKey}=${value[nestedKey]}]`);
            }
          });
        }
      } else {
        if (attributes["nodeType"] === "StringLiteral") {
          nqlArray.push(`[${key}="${value}"]`);
        } else {
          nqlArray.push(`[${key}=${value}]`);
        }
      }
    })
    return nqlArray.join("");
  }
}

class FindPatternWithNode extends BuilderNode {
  constructor(private attributes: object, level: number) {
    super();
    this.attributes = attributes;
    this.level = level;
  }

  generateSnippet(): string {
    const pattern = this.generateAttributesPattern(this.attributes);
    const result = [];
    result.push(`withNode({ ${pattern} }, () => {`);
    const childrenPattern = this.generateChildrenPattern();
    if (childrenPattern) {
      result.push(childrenPattern);
    }
    result.push(`});`);
    return result.map(line => " ".repeat(this.patternIndent()) + line).join("\n");
  }

  private generateAttributesPattern(attributes: { [key: string]: any }): string {
    return Object.keys(attributes).map((key) => {
      const value = attributes[key];
      if (ignoredAttribute(key, value)) {
        return;
      } else if (typeof value === "object") {
        return `${key}: { ${this.generateAttributesPattern(value)} }`;
      } else if (typeof value === "string") {
        return `${key}: "${value}"`;
      } else {
        return `${key}: ${value}`;
      }
    }).filter(attribute => attribute).join(", ");
  }
}

class ConvertPatternNode extends BuilderNode {
  constructor(private pattern: string, level: number) {
    super();
    this.pattern = pattern;
    this.level = level;
  }

  isEmpty() {
    return this.pattern.length === 0;
  }

  generateSnippet(): string {
    return " ".repeat(this.patternIndent()) + this.pattern;
  }
}

class SelectiveNode extends BuilderNode {
  constructor(level: number) {
    super();
    this.level = level;
    this.selected = false;
  }

  generateSnippet(): string {
    this.selected = true;
    return this.generateChildrenPattern();
  }
}

export default Builder;