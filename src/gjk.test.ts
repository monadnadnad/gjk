import {
  Point,
  Vec2,
  Rect,
  Triangle,
  Circle,
  supportConvex,
  supportOnMinkowskiDiffrence,
  isOriginOppositeSide,
  detectCollision
} from "./gjk";

describe("supportConvex", () => {
  // 長方形の頂点を定義
  const vertices = [
    new Vec2(-1, -1),
    new Vec2(1, -1),
    new Vec2(1, 1),
    new Vec2(-1, 1)
  ];

  test("should return the correct support point in direction (1, 1)", () => {
    const direction = new Vec2(1, 1);
    const support = supportConvex(vertices, direction);
    expect(support).toEqual(new Vec2(1, 1));
  });

  test("should return the correct support point in direction (-1, -1)", () => {
    const direction = new Vec2(-1, -1);
    const support = supportConvex(vertices, direction);
    expect(support).toEqual(new Vec2(-1, -1));
  });

  // 正三角形の頂点を定義
  const vertices2 = [
    new Vec2(-1, -0.577),
    new Vec2(1, -0.577),
    new Vec2(0, 1.155),
  ];

  test("should return the correct support point in direction (1, 0)", () => {
    const direction = new Vec2(1, 0);
    const support = supportConvex(vertices2, direction);
    expect(support).toEqual(new Vec2(1, -0.577));
  });
  
  test("should return the correct support point in direction (1, -1)", () => {
    const direction = new Vec2(1, -1);
    const support = supportConvex(vertices2, direction);
    expect(support).toEqual(new Vec2(1, -0.577));
  });

  test("should return the correct support point in direction (-1, -1)", () => {
    const direction = new Vec2(-1, -1);
    const support = supportConvex(vertices2, direction);
    expect(support).toEqual(new Vec2(-1, -0.577));
  });
});

describe("supportOnMinkowskiDiffrence", () => {
  test("should return correct point on minkowski diffrence", () => {
    const rect1 = new Rect(-0.5, -0.5, 1, 1);
    const rect2 = new Rect(0.5, 0.5, 1, 1);
    let direction = new Vec2(1, 1);
    expect(supportOnMinkowskiDiffrence(rect1, rect2, direction)).toEqual({x: 0, y: 0});
    direction = new Vec2(-1, -1);
    expect(supportOnMinkowskiDiffrence(rect1, rect2, direction)).toEqual({x: -2, y: -2});
  });
});

describe("isOriginOppositeSide", () => {
  test("true when a is opposite side from origin", () => {
    const a: Point = { x: 1, y: 1 };
    const b: Point = { x: 1, y: 0 };
    const c: Point = { x: 0, y: 1 };
    expect(isOriginOppositeSide(a, b, c)).toBe(true);
  });

  test("false when a is same side with origin", () => {
    const a: Point = { x: -1, y: -1 };
    const b: Point = { x: 1, y: 0 };
    const c: Point = { x: 0, y: 1 };
    expect(isOriginOppositeSide(a, b, c)).toBe(false);
  });

  test("false when origin is on bc", () => {
    const a: Point = { x: -1, y: 1 };
    const b: Point = { x: 1, y: 1 };
    const c: Point = { x: -1, y: -1 };
    expect(isOriginOppositeSide(a, b, c)).toBe(false);
  });
});

describe("detectCollision", () => {
  test("should detect collision when two rects intersect", () => {
    const rect1 = new Rect(0, 0, 2, 2);
    const rect2 = new Rect(1, 1, 2, 2);
    expect(detectCollision(rect1, rect2)).toBe(true);

    const rect3 = new Rect([
      {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1}
    ]);
    const rect4 = new Rect(0.5, 0.5, 1, 1);
    expect(detectCollision(rect3, rect4)).toBe(true);
  });
  
  test("should detect collision when two rects touched", () => {
    const rect1 = new Rect(-0.5, -0.5, 1, 1);
    const rect2 = new Rect(0.5, 0.5, 1, 1);
    expect(detectCollision(rect1, rect2)).toBe(true);
    
    const rect3 = new Rect(-0.5, -0.5, 1, 1);
    const rect4 = new Rect(0.5+0.000001, 0.5+0.000001, 1, 1);
    expect(detectCollision(rect3, rect4)).toBe(false);
  });

  test("should not detect collision when two rects do not intersect", () => {
    const rect1 = new Rect(0, 0, 2, 2);
    const rect2 = new Rect(3, 3, 2, 2);
    expect(detectCollision(rect1, rect2)).toBe(false);
  });

  test("detect collision of various supports", () => {
    const rect1 = new Rect(0, 0, 1, 1);
    const circle1 = new Circle(1, 1, 0.5);
    expect(detectCollision(rect1, circle1)).toBe(false);
    const circle2 = new Circle(1, 0.5, 0.5);
    expect(detectCollision(rect1, circle2)).toBe(true);
    const triangle1 = new Triangle([{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}]);
    expect(detectCollision(rect1, triangle1)).toBe(true);
  });
});
