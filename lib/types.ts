export type Location = {
  line: number;
  column: number;
};

export type Range = {
  start: Location;
  end: Location;
};
