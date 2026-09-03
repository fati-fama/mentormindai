import { QuadraticBezierCurve3, Vector3, TubeGeometry, SphereGeometry, CylinderGeometry, BoxGeometry } from "three";

export function createTube(
  start: [number, number, number],
  control: [number, number, number],
  end: [number, number, number],
  radius = 0.05,
  segments = 16
): TubeGeometry {
  const curve = new QuadraticBezierCurve3(
    new Vector3(...start),
    new Vector3(...control),
    new Vector3(...end)
  );
  return new TubeGeometry(curve, segments, radius, 8, false);
}

export function createLimb(
  length: number,
  radiusTop: number,
  radiusBottom: number,
  segments = 12
): CylinderGeometry {
  return new CylinderGeometry(radiusTop, radiusBottom, length, segments);
}

export function createJoint(radius: number): SphereGeometry {
  return new SphereGeometry(radius, 16, 16);
}

export function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius = 0.1
): BoxGeometry {
  const geo = new BoxGeometry(width, height, depth, 4, 4, 4);
  const pos = geo.attributes.position;
  const v = new Vector3();
  const hw = width / 2 - radius;
  const hh = height / 2 - radius;
  const hd = depth / 2 - radius;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const cx = Math.max(-hw, Math.min(hw, v.x));
    const cy = Math.max(-hh, Math.min(hh, v.y));
    const cz = Math.max(-hd, Math.min(hd, v.z));
    const dx = v.x - cx;
    const dy = v.y - cy;
    const dz = v.z - cz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len > 0) {
      const scale = radius / len;
      v.set(cx + dx * scale, cy + dy * scale, cz + dz * scale);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export { SphereGeometry, CylinderGeometry, BoxGeometry };
