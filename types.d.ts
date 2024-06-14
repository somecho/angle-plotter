type GraphNode = {
  x: number;
  y: number;
  active?: boolean;
}

type Edge = {
  idxA: Id;
  idxB: Id;
}

type Id = number;

type AngleRadians = number;