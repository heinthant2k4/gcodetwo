"use client";

import { useAppStore } from "@/store";
import { isPrincipalAxisFace } from "@/lib/view/camera-faces";

interface Direction {
    x: number;
    y: number;
    z: number;
}

interface Hotspot {
    id: string;
    points: string;
    direction: Direction;
}

const HOTSPOTS: Hotspot[] = [
    { id: "face_top", points: "84,24 113,36 92,50 63,38", direction: { x: 0, y: 1, z: 0 } },
    { id: "face_front", points: "63,38 92,50 92,82 63,70", direction: { x: 0, y: 0, z: -1 } },
    { id: "face_right", points: "92,50 113,36 113,68 92,82", direction: { x: 1, y: 0, z: 0 } },
    { id: "corner_tfr", points: "92,50 99,46 94,55", direction: { x: 1, y: 1, z: -1 } },
    { id: "corner_tfl", points: "63,38 70,34 75,43", direction: { x: -1, y: 1, z: -1 } },
    { id: "corner_bfr", points: "92,82 99,77 95,86", direction: { x: 1, y: -1, z: -1 } },
    { id: "corner_bfl", points: "63,70 70,66 75,75", direction: { x: -1, y: -1, z: -1 } },
    { id: "edge_top_front", points: "77,34 90,39 82,44 69,39", direction: { x: 0, y: 1, z: -1 } },
    { id: "edge_top_right", points: "99,36 108,40 102,48 94,43", direction: { x: 1, y: 1, z: 0 } },
    { id: "edge_front_right", points: "96,60 104,56 104,70 96,74", direction: { x: 1, y: 0, z: -1 } },
];

function isSameDirection(a: Direction, b: Direction): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
}

export default function OrientationPolyhedron() {
    const currentFaceId = useAppStore((s) => s.uiLayout.cameraFaceId);
    const currentDirection = useAppStore((s) => s.uiLayout.cameraDirection);
    const setCameraOrientation = useAppStore((s) => s.setCameraOrientation);
    const setViewMode = useAppStore((s) => s.setViewMode);

    const applyOrientation = (id: string, direction: Direction) => {
        setCameraOrientation(id, direction);
        setViewMode(isPrincipalAxisFace(direction) ? "2d" : "3d");
    };

    return (
        <div className="absolute right-2 top-2 z-20 pointer-events-auto">
            <svg width="146" height="146" viewBox="0 0 146 146" role="img" aria-label="View orientation polyhedron">
                {/* Triad */}
                <line x1="56" y1="100" x2="84" y2="114" stroke="#ff6d6d" strokeWidth="1.6" />
                <line x1="56" y1="100" x2="56" y2="71" stroke="#78b6ff" strokeWidth="1.6" />
                <line x1="56" y1="100" x2="74" y2="80" stroke="#50e7ac" strokeWidth="1.6" />
                <circle cx="56" cy="100" r="1.9" fill="#d1d5db" />

                {/* SolidWorks-style view cube */}
                <polygon points="84,24 113,36 92,50 63,38" fill="none" stroke="#6ca6d9" strokeWidth="1.2" />
                <polygon points="63,38 92,50 92,82 63,70" fill="none" stroke="#6ca6d9" strokeWidth="1.2" />
                <polygon points="92,50 113,36 113,68 92,82" fill="none" stroke="#6ca6d9" strokeWidth="1.2" />
                <polyline points="84,24 63,38 63,70 92,82 113,68 113,36 84,24" fill="none" stroke="#d9eeff" strokeOpacity="0.5" />

                {/* Click zones on cube surfaces */}
                {HOTSPOTS.map((spot) => {
                    const selected = currentFaceId === spot.id || isSameDirection(currentDirection, spot.direction);
                    return (
                        <g key={spot.id}>
                            <polygon
                                points={spot.points}
                                fill="transparent"
                                stroke={selected ? "#e7f4ff" : "transparent"}
                                strokeWidth={selected ? 1.1 : 0}
                                className="cursor-pointer"
                                onClick={() => applyOrientation(spot.id, spot.direction)}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
