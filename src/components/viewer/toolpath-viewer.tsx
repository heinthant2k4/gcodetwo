"use client";

// Toolpath Viewer — Three.js visualization
// Renders toolpath segments color-coded by motion type
// Supports 2D/3D toggle, orbit controls, and simulation scrubbing

import { useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import {
    useAppStore,
    selectHoveredLine,
} from "@/store";
import { ToolpathSegment, MotionType } from "@/lib/types/simulation";
import ExportOverlay from "./export-overlay";

// Color mapping for motion types — matches design tokens
const MOTION_COLORS: Record<MotionType, string> = {
    rapid: "#3B82F6",   // semantic-motion (blue)
    linear: "#22C55E",  // semantic-safe (green)
    cwArc: "#FACC15",   // semantic-warn (yellow)
    ccwArc: "#FACC15",  // semantic-warn (yellow)
};

const HIGHLIGHTED_COLOR = "#FFFFFF";
const DIMMED_ALPHA = 0.3;

function toScenePoint(
    point: { x: number; y: number; z: number },
    zAxisUp: boolean
): THREE.Vector3 {
    return new THREE.Vector3(
        point.x,
        zAxisUp ? point.z : -point.z,
        -point.y
    );
}

// Single toolpath line segment
function ToolpathLine({
    segment,
    isHighlighted,
    isBeforeCurrent,
    zAxisUp,
}: {
    segment: ToolpathSegment;
    isHighlighted: boolean;
    isBeforeCurrent: boolean;
    zAxisUp: boolean;
}) {
    const color = isHighlighted ? HIGHLIGHTED_COLOR : MOTION_COLORS[segment.motionType];
    const opacity = isBeforeCurrent ? 1.0 : DIMMED_ALPHA;

    const line = useMemo(() => {
        const start = toScenePoint(segment.startPoint, zAxisUp);
        const end = toScenePoint(segment.endPoint, zAxisUp);
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color,
            opacity,
            transparent: !isBeforeCurrent,
        });
        return new THREE.Line(geometry, material);
    }, [
        color,
        opacity,
        isBeforeCurrent,
        segment.startPoint,
        segment.endPoint,
        zAxisUp,
    ]);

    useEffect(
        () => () => {
            line.geometry.dispose();
            const material = line.material;
            if (Array.isArray(material)) {
                material.forEach((m) => m.dispose());
            } else {
                material.dispose();
            }
        },
        [line]
    );

    return <primitive object={line} />;
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
function AxisIndicator({ zAxisUp }: { zAxisUp: boolean }) {
    const xLine = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(10, 0, 0),
        ]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#EF4444" }));
    }, []);
    const yLine = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 10, 0),
        ]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#22C55E" }));
    }, []);
    const zLine = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, zAxisUp ? 10 : -10, 0),
        ]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#3B82F6" }));
    }, [zAxisUp]);

    useEffect(
        () => () => {
            [xLine, yLine, zLine].forEach((line) => {
                line.geometry.dispose();
                const material = line.material;
                if (Array.isArray(material)) {
                    material.forEach((m) => m.dispose());
                } else {
                    material.dispose();
                }
            });
        },
        [xLine, yLine, zLine]
    );

    return (
        <group>
            <primitive object={xLine} />
            <primitive object={yLine} />
            <primitive object={zLine} />
        </group>
    );
}

function SceneGrid() {
    const grid = useMemo(() => {
        const helper = new THREE.GridHelper(200, 20, "#2A2F38", "#2A2F38");
        return helper;
    }, []);

    useEffect(() => {
        return () => {
            grid.geometry.dispose();
            const mat = grid.material;
            if (Array.isArray(mat)) {
                mat.forEach((m) => m.dispose());
            } else {
                mat.dispose();
            }
        };
    }, [grid]);

    return <primitive object={grid} />;
}

// Camera auto-fit on data change
function CameraController({
    boundingBox,
    fitRequestId,
    cameraView,
    zAxisUp,
}: {
    boundingBox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    fitRequestId: number;
    cameraView: "iso" | "top" | "front" | "right";
    zAxisUp: boolean;
}) {
    const { camera } = useThree();

    useEffect(() => {
        const cx = (boundingBox.min.x + boundingBox.max.x) / 2;
        const cy = (zAxisUp ? 1 : -1) * (boundingBox.min.z + boundingBox.max.z) / 2;
        const cz = -(boundingBox.min.y + boundingBox.max.y) / 2;

        const sizeX = boundingBox.max.x - boundingBox.min.x;
        const sizeY = boundingBox.max.y - boundingBox.min.y;
        const sizeZ = boundingBox.max.z - boundingBox.min.z;
        const maxSize = Math.max(sizeX, sizeY, sizeZ, 50);

        const distance = maxSize * 1.25;
        const viewVectors: Record<"iso" | "top" | "front" | "right", THREE.Vector3> = {
            iso: new THREE.Vector3(1, 1, 1),
            top: new THREE.Vector3(0, 1, 0),
            front: new THREE.Vector3(0, 0, 1),
            right: new THREE.Vector3(1, 0, 0),
        };
        const upVectors: Record<"iso" | "top" | "front" | "right", THREE.Vector3> = {
            iso: new THREE.Vector3(0, 1, 0),
            top: new THREE.Vector3(0, 0, -1),
            front: new THREE.Vector3(0, 1, 0),
            right: new THREE.Vector3(0, 1, 0),
        };

        const direction = viewVectors[cameraView].clone().normalize();
        const up = upVectors[cameraView];

        camera.position.set(
            cx + direction.x * distance,
            cy + direction.y * distance,
            cz + direction.z * distance
        );
        camera.up.copy(up);
        camera.lookAt(cx, cy, cz);
        camera.updateProjectionMatrix();
    }, [boundingBox, camera, fitRequestId, cameraView, zAxisUp]);

    return null;
}

function ViewModeController({
    viewMode,
}: {
    viewMode: "2d" | "3d";
}) {
    const { camera, set, size } = useThree();
    const perspective = useMemo(
        () =>
            new THREE.PerspectiveCamera(50, size.width / Math.max(size.height, 1), 0.1, 10000),
        [size.width, size.height]
    );
    const orthographic = useMemo(() => {
        const scale = 6;
        const halfW = Math.max(size.width / scale, 1);
        const halfH = Math.max(size.height / scale, 1);
        return new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -1000, 10000);
    }, [size.width, size.height]);

    useEffect(() => {
        const nextCamera = viewMode === "3d" ? perspective : orthographic;
        if (camera !== nextCamera) {
            set({ camera: nextCamera });
        }
    }, [camera, orthographic, perspective, set, viewMode]);

    return null;
}

function OrbitCameraControls({ viewMode }: { viewMode: "2d" | "3d" }) {
    const { camera, gl } = useThree();
    const controls = useMemo(() => {
        const next = new OrbitControlsImpl(camera, gl.domElement);
        next.enableDamping = false;
        next.rotateSpeed = 0.5;
        next.panSpeed = 0.8;
        next.zoomSpeed = 1.0;
        next.enableRotate = viewMode === "3d";
        return next;
    }, [camera, gl.domElement, viewMode]);

    useFrame(() => {
        controls.update();
    });

    useEffect(() => {
        return () => controls.dispose();
    }, [controls]);

    return null;
}

// Auto-play animation
function PlaybackController() {
    const tick = useAppStore((s) => s.tick);

    useFrame((_, delta) => {
        // High-precision tick dispatched to store
        // delta is time since last frame in seconds
        tick(delta);
    });

    return null;
}

// Main scene content
function ToolpathScene() {
    const segments = useAppStore((s) => s.simulationData.segments);
    const boundingBox = useAppStore((s) => s.simulationData.boundingBox);
    const currentStepIndex = useAppStore((s) => s.simulation.currentStepIndex);
    const hoveredLine = useAppStore(selectHoveredLine);
    const viewMode = useAppStore((s) => s.uiLayout.viewMode);
    const cameraView = useAppStore((s) => s.uiLayout.cameraView);
    const showGrid = useAppStore((s) => s.uiLayout.showGrid);
    const showRapids = useAppStore((s) => s.uiLayout.showRapids);
    const hideFuturePath = useAppStore((s) => s.uiLayout.hideFuturePath);
    const zAxisUp = useAppStore((s) => s.uiLayout.zAxisUp);
    const cameraFitRequestId = useAppStore((s) => s.cameraFitRequestId);

    // Get current tool position
    const toolPosition = useMemo<[number, number, number]>(() => {
        if (segments.length === 0) return [0, 0, 0];
        // If we are parked at a step, show position at the end of the previous segment or start of current
        const idx = Math.min(currentStepIndex, segments.length - 1);
        const seg = segments[idx];
        const pos = currentStepIndex >= segments.length ? seg.endPoint : seg.startPoint;
        const scene = toScenePoint(pos, zAxisUp);
        return [scene.x, scene.y, scene.z];
    }, [segments, currentStepIndex, zAxisUp]);

    const visibleSegments = useMemo(() => {
        return segments.filter((segment) => {
            if (!showRapids && segment.motionType === "rapid") return false;
            if (hideFuturePath && segment.index >= currentStepIndex) return false;
            return true;
        });
    }, [segments, showRapids, hideFuturePath, currentStepIndex]);

    return (
        <>
            <ViewModeController viewMode={viewMode} />
            <CameraController
                boundingBox={boundingBox}
                fitRequestId={cameraFitRequestId}
                cameraView={cameraView}
                zAxisUp={zAxisUp}
            />
            <PlaybackController />

            {/* Lighting — minimal, functional only */}
            <ambientLight intensity={0.8} />

            {/* Grid */}
            {showGrid && <SceneGrid />}

            {/* Axis indicator */}
            <AxisIndicator zAxisUp={zAxisUp} />

            {/* Toolpath lines */}
            {visibleSegments.map((segment) => (
                <ToolpathLine
                    key={segment.index}
                    segment={segment}
                    isHighlighted={hoveredLine !== null && segment.sourceLine === hoveredLine}
                    isBeforeCurrent={segment.index < currentStepIndex}
                    zAxisUp={zAxisUp}
                />
            ))}

            {/* Tool position */}
            {segments.length > 0 && <ToolIndicator position={toolPosition} />}

            {/* Orbit controls */}
            <OrbitCameraControls viewMode={viewMode} />
        </>
    );
}

export default function ToolpathViewer() {
    return (
        <div className="h-full w-full bg-bg-900 relative" id="viewer-panel">
            <Canvas
                gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
                style={{ background: "#0F1216" }}
                camera={{ fov: 50, position: [150, 100, 150], near: 0.1, far: 10000 }}
                onCreated={({ gl }) => {
                    gl.setClearColor("#0F1216");
                }}
            >
                <ToolpathScene />
            </Canvas>
            <ExportOverlay />
        </div>
    );
}
