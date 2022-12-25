class FakeNode {
  public range: { start: number, end: number };

  constructor(private name: string) {}

  public toString(): string {
    return `{{${this.name}}}`;
  }
}

export default FakeNode;