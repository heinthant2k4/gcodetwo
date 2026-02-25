export interface CameraDirection {
    x: number;
    y: number;
    z: number;
}

export interface CameraFace {
    id: string;
    kind: "triangle" | "square";
    direction: CameraDirection;
}

function makeDirection(x: number, y: number, z: number): CameraDirection {
    return { x, y, z };
}

const faces: CameraFace[] = [];

// Triangle faces: ±X ±Y ±Z
for (const x of [-1, 1] as const) {
    for (const y of [-1, 1] as const) {
        for (const z of [-1, 1] as const) {
            faces.push({
                id: `tri_${x}_${y}_${z}`,
                kind: "triangle",
                direction: makeDirection(x, y, z),
            });
        }
    }
}

// Square faces: axis-aligned
faces.push(
    { id: "sq_1_0_0", kind: "square", direction: makeDirection(1, 0, 0) },
    { id: "sq_-1_0_0", kind: "square", direction: makeDirection(-1, 0, 0) },
    { id: "sq_0_1_0", kind: "square", direction: makeDirection(0, 1, 0) },
    { id: "sq_0_-1_0", kind: "square", direction: makeDirection(0, -1, 0) },
    { id: "sq_0_0_1", kind: "square", direction: makeDirection(0, 0, 1) },
    { id: "sq_0_0_-1", kind: "square", direction: makeDirection(0, 0, -1) }
);

// Square faces: edge-centered permutations (±1, ±1, 0)
const edgePairs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
] as const;

for (const [x, y] of edgePairs) {
    faces.push({ id: `sq_${x}_${y}_0`, kind: "square", direction: makeDirection(x, y, 0) });
    faces.push({ id: `sq_${x}_0_${y}`, kind: "square", direction: makeDirection(x, 0, y) });
    faces.push({ id: `sq_0_${x}_${y}`, kind: "square", direction: makeDirection(0, x, y) });
}

export const RHOMBICUBOCTAHEDRON_FACES: CameraFace[] = faces;

export const CAMERA_FACE_PRESETS = {
    front: { id: "sq_0_0_1", direction: makeDirection(0, 0, 1) },
    right: { id: "sq_1_0_0", direction: makeDirection(1, 0, 0) },
    top: { id: "sq_0_1_0", direction: makeDirection(0, 1, 0) },
    iso: { id: "tri_1_1_1", direction: makeDirection(1, 1, 1) },
} as const;

export function isPrincipalAxisFace(direction: CameraDirection): boolean {
    const nonZero = [direction.x, direction.y, direction.z].filter((v) => v !== 0).length;
    return nonZero === 1;
}
