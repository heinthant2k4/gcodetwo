// Simulation Type Definitions

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export type MotionType = "rapid" | "linear" | "cwArc" | "ccwArc";

export interface ToolpathSegment {
    index: number;
    startPoint: Point3D;
    endPoint: Point3D;
    motionType: MotionType;
    feedRate: number;
    sourceLine: number;
    distance: number;
    duration: number; // seconds
}

export interface SimulationStep {
    segmentIndex: number;
    sourceLine: number; // Mapping back to editor line
    cumulativeTime: number; // seconds from start
    cumulativeDistance: number;
    position: Point3D;
}

export interface SimulationData {
    segments: ToolpathSegment[];
    steps: SimulationStep[];
    totalTime: number;
    totalDistance: number;
    boundingBox: {
        min: Point3D;
        max: Point3D;
    };
}
