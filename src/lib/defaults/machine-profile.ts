// Default Machine Profile
// Standard 3-axis CNC mill configuration

import { MachineProfile } from "@/lib/types/machine";

export const DEFAULT_MACHINE_PROFILE: MachineProfile = {
    name: "Default 3-Axis CNC",
    units: "mm",
    axes: {
        x: { min: 0, max: 200 },
        y: { min: 0, max: 200 },
        z: { min: -50, max: 100 },
    },
    maxFeedRate: 5000,
    maxSpindleSpeed: 24000,
    supportedGCodes: [
        "G0", "G1", "G2", "G3",
        "G17", "G18", "G19",
        "G20", "G21",
        "G28",
        "G40", "G41", "G42",
        "G43", "G49",
        "G54", "G55", "G56", "G57", "G58", "G59",
        "G80", "G81", "G82", "G83",
        "G90", "G91",
        "G94", "G95",
    ],
    supportedMCodes: [
        "M0", "M1", "M2",
        "M3", "M4", "M5",
        "M6",
        "M7", "M8", "M9",
        "M30",
    ],
};
