export type Location = {
  line: number;
  column: number;
};

export type Range = {
  start: Location;
  end: Location;
};

export type Snippet = {
  id: number,
  group: string,
  name: string,
  description: string,
}
