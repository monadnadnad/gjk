const GJK_MAX_ITERATION = 100;

export interface Point {
  x: number;
  y: number;
}

export class Vec2 {
  x: number;
  y: number;
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  clone() {    
    return new Vec2(this.x, this.y);
  }
  dot(other: Vec2 | Point): number {
    return this.x * other.x + this.y * other.y;
  }
  length(): number {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }
  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }
  normalize(): this {
    const l = this.length();
    if (l == 0) return this;
    return this.multiplyScalar(1 / l);
  }
}

// サポート関数が定義されている図形
interface Support {
  support(direction: Vec2): Point;
}

export const supportConvex = (vertices: Point[], dir: Vec2): Point => {
  // 方向dirに向かって一番遠い点を求める
  let maxDot = -Infinity;
  let maxPoint: Point = vertices[0];
  for (const point of vertices) {
      const dot = dir.x * point.x + dir.y * point.y;
      if (maxDot < dot) {
          maxDot = dot;
          maxPoint = point;
      }
  }
  return maxPoint;
}

export class Rect implements Support {
  vertices: Point[];

  constructor(x: number, y: number, width: number, height: number);
  constructor(vertices: [Point, Point, Point, Point]);
  constructor(xOrPoints: number | [Point, Point, Point, Point], y_?: number, width?: number, height?: number) {
    if (typeof xOrPoints === 'number') {
      let x = xOrPoints;
      let y = y_!;
      let w = width!;
      let h = height!;
      this.vertices = [
        { x: x - w / 2, y: y - h / 2 },
        { x: x - w / 2, y: y + h / 2 },
        { x: x + w / 2, y: y + h / 2 },
        { x: x + w / 2, y: y - h / 2 }
      ];
    } else {
      this.vertices = xOrPoints;
    }
  }

  support(direction: Vec2): Point {
    return supportConvex(this.vertices, direction);
  }
}

export class Triangle implements Support {
  vertices: Point[];

  constructor(vertices: [Point, Point, Point]) {
    this.vertices = vertices;
  }

  support(direction: Vec2): Point {
    return supportConvex(this.vertices, direction);
  }
}

export class Circle implements Support {
  x: number;
  y: number;
  r: number;
  constructor(x: number, y: number, r: number) {
    this.x = x;
    this.y = y;
    this.r = r;
  }
  support(direction: Vec2): Point {
    let v = direction.clone().normalize().multiplyScalar(this.r);
    return {x: v.x + this.x, y: v.y + this.y};
  }
}

export const supportOnMinkowskiDiffrence = (supportA: Support, supportB: Support, dir: Vec2): Point => {
  // A-Bの支点を求める
  // それぞれの上で支点を求めて差を取る事で求められる
  let dirA = dir.clone().normalize();
  let pointA = supportA.support(dirA);
  let pointB = supportB.support(dirA.negate());
  return {x: pointA.x - pointB.x, y: pointA.y - pointB.y};
}

/**
 * aがb->cから見てOと逆側にあるか判定する
 */
export const isOriginOppositeSide = (a: Point, b: Point, c: Point): boolean => {
  // bcにOが乗っている場合は同じ側にあると判定する（3通り全てで同じ側＝三角形内部にあるだから）
  // Oの方を向いているbcの法線を求める
  let n = new Vec2(b.y - c.y, c.x - b.x);
  let dot = n.dot(b);
  if (dot > 0) {
    n.negate();
  } else if (dot == 0) {
    return false;
  }
  // O->aとnが逆向きなら反対側にある
  if (n.dot(a) < 0) return true;
  return false;
}

export const detectCollision = (supportA: Support, supportB: Support): boolean => {
  // A-B上の点p0をランダムに選ぶ
  const angle = Math.random() * 2 * Math.PI;
  let direction = new Vec2(Math.cos(angle), Math.sin(angle));
  
  let p0 = supportOnMinkowskiDiffrence(supportA, supportB, direction);
  // A-B上の点を3つ求めて単体を張る
  // p0->o方向のA-B上の支点を求める
  direction = new Vec2(-p0.x, -p0.y);
  let p1 = supportOnMinkowskiDiffrence(supportA, supportB, direction);
  
  // 終了判定
  if (direction.dot(p1) < 0) {
    return false;
  }
  
  for (let i=0; i < GJK_MAX_ITERATION; i++) {
    // 直線p0->p1の法線方向のうち原点がある側に向いている方を取る
    // o->p0との内積が負のものを取ればよい
    let direction = new Vec2(p1.y - p0.y, p0.x - p1.x);
    if (direction.dot(p0) > 0) {
      direction.negate();
    }
    // A-B上の3個めの支点を求める
    let p2 = supportOnMinkowskiDiffrence(supportA, supportB, direction);
    
    // 終了判定
    if (direction.dot(p2) < 0) {
      return false;
    }
    
    if (isOriginOppositeSide(p0, p1, p2)) {
      [p0, p1] = [p1, p2];
      continue;
    }
    if (isOriginOppositeSide(p1, p2, p0)) {
      [p0, p1] = [p2, p0];
      continue;
    }
    if (isOriginOppositeSide(p2, p0, p1)) {
      // [p0, p1] = [p0, p1];
      continue;
    }
    // 原点は内部（もしくは境界）にある
    return true;
  }
  // 判定出来なかった場合衝突していないとみなす
  return false;
}
