"use client";

// Toolpath Viewer — Three.js visualization
// Renders toolpath segments color-coded by motion type
// Supports 2D/3D toggle, orbit controls, and simulation scrubbing

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Line, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
    useAppStore,
    selectSimulationData,
    selectSimulation,
    selectUILayout,
    selectHoveredLine,
} from "@/store";
import { ToolpathSegment, MotionType } from "@/lib/types/simulation";

// Color mapping for motion types — matches design tokens
const MOTION_COLORS: Record<MotionType, string> = {
    rapid: "#3B82F6",   // semantic-motion (blue)
    linear: "#22C55E",  // semantic-safe (green)
    cwArc: "#FACC15",   // semantic-warn (yellow)
    ccwArc: "#FACC15",  // semantic-warn (yellow)
};

const HIGHLIGHTED_COLOR = "#FFFFFF";
const DIMMED_ALPHA = 0.3;

// Single toolpath line segment
function ToolpathLine({
    segment,
    isHighlighted,
    isBeforeCurrent,
}: {
    segment: ToolpathSegment;
    isHighlighted: boolean;
    isBeforeCurrent: boolean;
}) {
    const color = isHighlighted ? HIGHLIGHTED_COLOR : MOTION_COLORS[segment.motionType];
    const opacity = isBeforeCurrent ? 1.0 : DIMMED_ALPHA;

    const points: [number, number, number][] = [
        [segment.startPoint.x, segment.startPoint.z, -segment.startPoint.y],
        [segment.endPoint.x, segment.endPoint.z, -segment.endPoint.y],
    ];

    return (
        <Line
            points={points}
            color={color}
            lineWidth={isHighlighted ? 2.5 : 1.5}
            opacity={opacity}
            transparent={!isBeforeCurrent}
        />
    );
}

// Tool position indicator
function ToolIndicator({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshBasicMaterial color="#3B82F6" />
        </mesh>
    );
}

// Axis indicator lines
function AxisIndicator() {
    return (
        <group>
            <Line points={[[0, 0, 0], [10, 0, 0]]} color="#EF4444" lineWidth={1.5} />
            <Line points={[[0, 0, 0], [0, 10, 0]]} color="#22C55E" lineWidth={1.5} />
            <Line points={[[0, 0, 0], [0, 0, -10]]} color="#3B82F6" lineWidth={1.5} />
        </group>
    );
}

// Camera auto-fit on data change
function CameraController({ boundingBox }: { boundingBox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } }) {
    const { camera } = useThree();
    const hasSet = useRef(false);

    useEffect(() => {
        if (hasSet.current) return;

        const cx = (boundingBox.min.x + boundingBox.max.x) / 2;
        const cy = (boundingBox.min.z + boundingBox.max.z) / 2;
        const cz = -(boundingBox.min.y + boundingBox.max.y) / 2;

        const sizeX = boundingBox.max.x - boundingBox.min.x;
        const sizeY = boundingBox.max.y - boundingBox.min.y;
        const sizeZ = boundingBox.max.z - boundingBox.min.z;
        const maxSize = Math.max(sizeX, sizeY, sizeZ, 50);

        camera.position.set(cx + maxSize * 0.8, cy + maxSize * 0.8, cz + maxSize * 0.8);
        camera.lookAt(cx, cy, cz);
        camera.updateProjectionMatrix();
        hasSet.current = true;
    }, [boundingBox, camera]);

    return null;
}

// Auto-play animation
function PlaybackController() {
    const simulation = useAppStore(selectSimulation);
    const simulationData = useAppStore(selectSimulationData);
    const setCurrentStep = useAppStore((s) => s.setCurrentStep);
    const pause = useAppStore((s) => s.pause);

    useFrame((_, delta) => {
        if (!simulation.playing) return;
        const maxStep = simulationData.segments.length;
        if (maxStep === 0) return;

        const nextStep = simulation.currentStep + delta * simulation.speed * 10;
        if (nextStep >= maxStep) {
            setCurrentStep(maxStep);
            pause();
        } else {
            setCurrentStep(Math.floor(nextStep));
        }
    });

    return null;
}

// Main scene content
function ToolpathScene() {
    const simulationData = useAppStore(selectSimulationData);
    const simulation = useAppStore(selectSimulation);
    const hoveredLine = useAppStore(selectHoveredLine);
    const uiLayout = useAppStore(selectUILayout);

    const segments = simulationData.segments;
    const currentStep = simulation.currentStep;

    // Get current tool position
    const toolPosition = useMemo<[number, number, number]>(() => {
        if (segments.length === 0) return [0, 0, 0];
        const idx = Math.min(currentStep, segments.length - 1);
        const seg = segments[idx];
        const pos = currentStep >= segments.length ? seg.endPoint : seg.startPoint;
        return [pos.x, pos.z, -pos.y];
    }, [segments, currentStep]);

    return (
        <>
            {/* Camera */}
            {uiLayout.viewMode === "3d" ? (
                <PerspectiveCamera makeDefault fov={50} position={[150, 100, 150]} />
            ) : (
                <OrthographicCamera makeDefault zoom={3} position={[100, 200, 0]} />
            )}

            <CameraController boundingBox={simulationData.boundingBox} />
            <PlaybackController />

            {/* Lighting — minimal, functional only */}
            <ambientLight intensity={0.8} />

            {/* Grid */}
            <Grid
                args={[200, 200]}
                cellSize={10}
                cellThickness={0.5}
                cellColor="#2A2F38"
                sectionSize={50}
                sectionThickness={1}
                sectionColor="#2A2F38"
                fadeDistance={400}
                infiniteGrid
                position={[100, 0, -100]}
            />

            {/* Axis indicator */}
            <AxisIndicator />

            {/* Toolpath lines */}
            {segments.map((segment) => (
                <ToolpathLine
                    key={segment.index}
                    segment={segment}
                    isHighlighted={hoveredLine !== null && segment.sourceLine === hoveredLine}
                    isBeforeCurrent={segment.index < currentStep}
                />
            ))}

            {/* Tool position */}
            {segments.length > 0 && <ToolIndicator position={toolPosition} />}

            {/* Orbit controls */}
            <OrbitControls
                enableDamping={false}
                rotateSpeed={0.5}
                panSpeed={0.8}
                zoomSpeed={1.0}
                enableRotate={uiLayout.viewMode === "3d"}
            />
        </>
    );
}

export default function ToolpathViewer() {
    return (
        <div className="h-full w-full bg-bg-900" id="viewer-panel">
            <Canvas
                gl={{ antialias: true, alpha: false }}
                style={{ background: "#0F1216" }}
                onCreated={({ gl }) => {
                    gl.setClearColor("#0F1216");
                }}
            >
                <ToolpathScene />
            </Canvas>
        </div>
    );
}
