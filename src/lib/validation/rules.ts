// Validation Rules
// Rule-based validators for G-code instructions against machine profile
// Each rule returns Diagnostic[] — deterministic, no guessing

import { GCodeInstruction } from "@/lib/types/gcode";
import { MachineProfile } from "@/lib/types/machine";
import { Diagnostic } from "@/lib/types/diagnostics";
import { getCommandString, getParam } from "@/lib/gcode/parser";

type ValidationRule = (
    instruction: GCodeInstruction,
    profile: MachineProfile,
    state: ValidationState
) => Diagnostic[];

interface ValidationState {
    currentX: number;
    currentY: number;
    currentZ: number;
    feedRate: number;
    absoluteMode: boolean;
    units: "mm" | "inch";
}

export function createInitialValidationState(profile: MachineProfile): ValidationState {
    return {
        currentX: 0,
        currentY: 0,
        currentZ: 0,
        feedRate: 0,
        absoluteMode: true,
        units: profile.units,
    };
}

// Rule: Unsupported G-code command
const unsupportedCommand: ValidationRule = (instruction, profile) => {
    const cmd = getCommandString(instruction);
    if (!cmd) return [];

    const letter = cmd[0];
    const supported =
        letter === "G" ? profile.supportedGCodes : letter === "M" ? profile.supportedMCodes : [];

    if (supported.length > 0 && !supported.includes(cmd)) {
        return [
            {
                severity: "error",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: `Unsupported command: ${cmd}`,
                ruleId: "unsupported-command",
            },
        ];
    }

    return [];
};

// Rule: Out-of-bounds position
const outOfBounds: ValidationRule = (instruction, profile, state) => {
    const cmd = getCommandString(instruction);
    if (!cmd || !["G0", "G1", "G2", "G3"].includes(cmd)) return [];

    const diagnostics: Diagnostic[] = [];
    const x = getParam(instruction, "X");
    const y = getParam(instruction, "Y");
    const z = getParam(instruction, "Z");

    const targetX = x !== undefined ? (state.absoluteMode ? x : state.currentX + x) : state.currentX;
    const targetY = y !== undefined ? (state.absoluteMode ? y : state.currentY + y) : state.currentY;
    const targetZ = z !== undefined ? (state.absoluteMode ? z : state.currentZ + z) : state.currentZ;

    if (targetX < profile.axes.x.min || targetX > profile.axes.x.max) {
        diagnostics.push({
            severity: "error",
            line: instruction.lineNumber,
            column: 0,
            endColumn: instruction.raw.length,
            message: `X position ${targetX} is out of bounds [${profile.axes.x.min}, ${profile.axes.x.max}]`,
            ruleId: "out-of-bounds-x",
        });
    }

    if (targetY < profile.axes.y.min || targetY > profile.axes.y.max) {
        diagnostics.push({
            severity: "error",
            line: instruction.lineNumber,
            column: 0,
            endColumn: instruction.raw.length,
            message: `Y position ${targetY} is out of bounds [${profile.axes.y.min}, ${profile.axes.y.max}]`,
            ruleId: "out-of-bounds-y",
        });
    }

    if (targetZ < profile.axes.z.min || targetZ > profile.axes.z.max) {
        diagnostics.push({
            severity: "error",
            line: instruction.lineNumber,
            column: 0,
            endColumn: instruction.raw.length,
            message: `Z position ${targetZ} is out of bounds [${profile.axes.z.min}, ${profile.axes.z.max}]`,
            ruleId: "out-of-bounds-z",
        });
    }

    return diagnostics;
};

// Rule: Missing feed rate for linear/arc moves
const missingFeedRate: ValidationRule = (instruction, _profile, state) => {
    const cmd = getCommandString(instruction);
    if (!cmd || !["G1", "G2", "G3"].includes(cmd)) return [];

    const f = getParam(instruction, "F");
    if (f === undefined && state.feedRate <= 0) {
        return [
            {
                severity: "warning",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: "No feed rate specified for cutting move — F value required",
                ruleId: "missing-feed-rate",
            },
        ];
    }

    return [];
};

// Rule: Feed rate exceeds maximum
const feedRateExceeded: ValidationRule = (instruction, profile) => {
    const f = getParam(instruction, "F");
    if (f === undefined) return [];

    if (f > profile.maxFeedRate) {
        return [
            {
                severity: "warning",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: `Feed rate F${f} exceeds maximum ${profile.maxFeedRate} ${profile.units}/min`,
                ruleId: "feed-rate-exceeded",
            },
        ];
    }

    if (f <= 0) {
        return [
            {
                severity: "error",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: "Feed rate must be positive",
                ruleId: "invalid-feed-rate",
            },
        ];
    }

    return [];
};

// Rule: Spindle speed exceeds maximum
const spindleSpeedExceeded: ValidationRule = (instruction, profile) => {
    const cmd = getCommandString(instruction);
    if (!cmd || !["M3", "M4"].includes(cmd)) return [];

    const s = getParam(instruction, "S");
    if (s !== undefined && s > profile.maxSpindleSpeed) {
        return [
            {
                severity: "warning",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: `Spindle speed S${s} exceeds maximum ${profile.maxSpindleSpeed} RPM`,
                ruleId: "spindle-speed-exceeded",
            },
        ];
    }

    return [];
};

// Rule: Arc move missing I/J/K or R parameters
const arcMissingParams: ValidationRule = (instruction) => {
    const cmd = getCommandString(instruction);
    if (!cmd || !["G2", "G3"].includes(cmd)) return [];

    const hasI = getParam(instruction, "I") !== undefined;
    const hasJ = getParam(instruction, "J") !== undefined;
    const hasR = getParam(instruction, "R") !== undefined;

    if (!hasI && !hasJ && !hasR) {
        return [
            {
                severity: "error",
                line: instruction.lineNumber,
                column: 0,
                endColumn: instruction.raw.length,
                message: "Arc move requires I/J center offsets or R radius",
                ruleId: "arc-missing-params",
            },
        ];
    }

    return [];
};

// All rules
const ALL_RULES: ValidationRule[] = [
    unsupportedCommand,
    outOfBounds,
    missingFeedRate,
    feedRateExceeded,
    spindleSpeedExceeded,
    arcMissingParams,
];

// Update validation state from instruction (for stateful rules)
export function updateValidationState(
    state: ValidationState,
    instruction: GCodeInstruction
): ValidationState {
    const cmd = getCommandString(instruction);
    const next = { ...state };

    if (cmd === "G90") next.absoluteMode = true;
    if (cmd === "G91") next.absoluteMode = false;
    if (cmd === "G20") next.units = "inch";
    if (cmd === "G21") next.units = "mm";

    const f = getParam(instruction, "F");
    if (f !== undefined) next.feedRate = f;

    if (cmd && ["G0", "G1", "G2", "G3"].includes(cmd)) {
        const x = getParam(instruction, "X");
        const y = getParam(instruction, "Y");
        const z = getParam(instruction, "Z");

        if (x !== undefined) next.currentX = state.absoluteMode ? x : state.currentX + x;
        if (y !== undefined) next.currentY = state.absoluteMode ? y : state.currentY + y;
        if (z !== undefined) next.currentZ = state.absoluteMode ? z : state.currentZ + z;
    }

    return next;
}

export { ALL_RULES };
export type { ValidationState };
