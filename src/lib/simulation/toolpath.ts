// Toolpath Generator
// Converts parsed G-code instructions into toolpath segments
// Pure function — no side effects, fully deterministic

import { GCodeInstruction } from "@/lib/types/gcode";
import { ToolpathSegment, Point3D, MotionType, SimulationData, SimulationStep } from "@/lib/types/simulation";
import { getCommandString, getParam } from "@/lib/gcode/parser";

interface ToolpathState {
    position: Point3D;
    feedRate: number;
    absoluteMode: boolean;
    motionMode: MotionType | null;
}

function distance3D(a: Point3D, b: Point3D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeArcLength(
    start: Point3D,
    end: Point3D,
    i: number,
    j: number,
    clockwise: boolean
): number {
    const cx = start.x + i;
    const cy = start.y + j;
    const radius = Math.sqrt(i * i + j * j);

    let startAngle = Math.atan2(start.y - cy, start.x - cx);
    let endAngle = Math.atan2(end.y - cy, end.x - cx);

    let sweep: number;
    if (clockwise) {
        sweep = startAngle - endAngle;
        if (sweep <= 0) sweep += 2 * Math.PI;
    } else {
        sweep = endAngle - startAngle;
        if (sweep <= 0) sweep += 2 * Math.PI;
    }

    const arcLen2D = radius * sweep;
    const dz = end.z - start.z;
    return Math.sqrt(arcLen2D * arcLen2D + dz * dz);
}

export function generateToolpath(instructions: GCodeInstruction[]): SimulationData {
    const segments: ToolpathSegment[] = [];
    const state: ToolpathState = {
        position: { x: 0, y: 0, z: 0 },
        feedRate: 100,
        absoluteMode: true,
        motionMode: null,
    };

    const RAPID_FEED = 10000; // mm/min for rapid moves

    for (const instruction of instructions) {
        const cmd = getCommandString(instruction);

        // Mode changes
        if (cmd === "G90") {
            state.absoluteMode = true;
            continue;
        }
        if (cmd === "G91") {
            state.absoluteMode = false;
            continue;
        }

        // Feed rate update
        const f = getParam(instruction, "F");
        if (f !== undefined && f > 0) {
            state.feedRate = f;
        }

        // Motion commands
        let motionType: MotionType | null = null;
        if (cmd === "G0") motionType = "rapid";
        else if (cmd === "G1") motionType = "linear";
        else if (cmd === "G2") motionType = "cwArc";
        else if (cmd === "G3") motionType = "ccwArc";

        if (motionType === null) continue;

        const x = getParam(instruction, "X");
        const y = getParam(instruction, "Y");
        const z = getParam(instruction, "Z");

        // No movement parameters
        if (x === undefined && y === undefined && z === undefined) continue;

        const startPoint: Point3D = { ...state.position };
        const endPoint: Point3D = {
            x: x !== undefined ? (state.absoluteMode ? x : state.position.x + x) : state.position.x,
            y: y !== undefined ? (state.absoluteMode ? y : state.position.y + y) : state.position.y,
            z: z !== undefined ? (state.absoluteMode ? z : state.position.z + z) : state.position.z,
        };

        let dist: number;
        if (motionType === "cwArc" || motionType === "ccwArc") {
            const iVal = getParam(instruction, "I") ?? 0;
            const jVal = getParam(instruction, "J") ?? 0;
            dist = computeArcLength(startPoint, endPoint, iVal, jVal, motionType === "cwArc");
        } else {
            dist = distance3D(startPoint, endPoint);
        }

        const effectiveFeed = motionType === "rapid" ? RAPID_FEED : state.feedRate;
        const duration = dist > 0 ? (dist / effectiveFeed) * 60 : 0; // seconds

        if (dist > 0) {
            segments.push({
                index: segments.length,
                startPoint,
                endPoint,
                motionType,
                feedRate: effectiveFeed,
                sourceLine: instruction.lineNumber,
                distance: dist,
                duration,
            });
        }

        state.position = { ...endPoint };
    }

    // Compute simulation steps and bounding box
    const steps: SimulationStep[] = [];
    let cumulativeTime = 0;
    let cumulativeDistance = 0;
    const min: Point3D = { x: 0, y: 0, z: 0 };
    const max: Point3D = { x: 0, y: 0, z: 0 };

    for (const seg of segments) {
        steps.push({
            segmentIndex: seg.index,
            cumulativeTime,
            cumulativeDistance,
            position: seg.startPoint,
        });

        cumulativeTime += seg.duration;
        cumulativeDistance += seg.distance;

        // Update bounding box
        min.x = Math.min(min.x, seg.startPoint.x, seg.endPoint.x);
        min.y = Math.min(min.y, seg.startPoint.y, seg.endPoint.y);
        min.z = Math.min(min.z, seg.startPoint.z, seg.endPoint.z);
        max.x = Math.max(max.x, seg.startPoint.x, seg.endPoint.x);
        max.y = Math.max(max.y, seg.startPoint.y, seg.endPoint.y);
        max.z = Math.max(max.z, seg.startPoint.z, seg.endPoint.z);
    }

    // Final step at end of last segment
    if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        steps.push({
            segmentIndex: lastSeg.index,
            cumulativeTime,
            cumulativeDistance,
            position: lastSeg.endPoint,
        });
    }

    return {
        segments,
        steps,
        totalTime: cumulativeTime,
        totalDistance: cumulativeDistance,
        boundingBox: { min, max },
    };
}
