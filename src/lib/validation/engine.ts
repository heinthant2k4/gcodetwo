// Validation Engine
// Runs all rules against parsed instructions + machine profile
// Produces sorted diagnostic list — fully deterministic

import { GCodeInstruction } from "@/lib/types/gcode";
import { MachineProfile } from "@/lib/types/machine";
import { Diagnostic, ValidationResult } from "@/lib/types/diagnostics";
import {
    ALL_RULES,
    createInitialValidationState,
    updateValidationState,
} from "./rules";

export function validate(
    instructions: GCodeInstruction[],
    profile: MachineProfile
): ValidationResult {
    const diagnostics: Diagnostic[] = [];
    let state = createInitialValidationState(profile);

    for (const instruction of instructions) {
        // Skip empty lines and comment-only lines
        if (!instruction.command && !instruction.parameters.length) continue;

        // Run all rules against this instruction
        for (const rule of ALL_RULES) {
            const results = rule(instruction, profile, state);
            diagnostics.push(...results);
        }

        // Update state for next instruction
        state = updateValidationState(state, instruction);
    }

    // Sort by line number, then severity (error > warning > info)
    const severityOrder = { error: 0, warning: 1, info: 2 };
    diagnostics.sort((a, b) => {
        if (a.line !== b.line) return a.line - b.line;
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const errorCount = diagnostics.filter((d) => d.severity === "error").length;
    const warningCount = diagnostics.filter((d) => d.severity === "warning").length;
    const infoCount = diagnostics.filter((d) => d.severity === "info").length;

    return {
        diagnostics,
        errorCount,
        warningCount,
        infoCount,
        isValid: errorCount === 0,
    };
}
