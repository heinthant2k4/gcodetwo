// G-code Parser
// Converts raw text into structured instruction list
// Deterministic — same input always produces same output

import { GCodeInstruction, GCodeWord, ParseError, ParseResult } from "@/lib/types/gcode";
import { tokenizeLine } from "./tokenizer";

export function parseGCode(text: string): ParseResult {
    const lines = text.split("\n");
    const instructions: GCodeInstruction[] = [];
    const errors: ParseError[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const raw = lines[i];
        const trimmed = raw.trim();

        // Empty lines
        if (trimmed === "" || trimmed === "%") {
            instructions.push({
                lineNumber: lineNum,
                command: null,
                parameters: [],
                comment: null,
                raw,
                blockDelete: false,
            });
            continue;
        }

        const tokens = tokenizeLine(trimmed);

        let blockDelete = false;
        let command: GCodeWord | null = null;
        const parameters: GCodeWord[] = [];
        let comment: string | null = null;

        for (const token of tokens) {
            if (token.type === "unknown" && token.value === "/") {
                blockDelete = true;
                continue;
            }

            if (token.type === "unknown" && token.value === "%") {
                continue;
            }

            if (token.type === "comment") {
                comment = token.value;
                continue;
            }

            if (token.type === "lineNumber") {
                continue;
            }

            if (token.type === "word") {
                const letter = token.value[0].toUpperCase();
                const numStr = token.value.slice(1);
                const value = parseFloat(numStr);

                if (isNaN(value)) {
                    errors.push({
                        line: lineNum,
                        column: token.column,
                        message: `Invalid number in word: ${token.raw}`,
                    });
                    continue;
                }

                const word: GCodeWord = {
                    letter,
                    value,
                    raw: token.raw,
                };

                // G and M commands
                if ((letter === "G" || letter === "M") && command === null) {
                    command = word;
                } else if (letter === "G" || letter === "M") {
                    // Multiple commands on one line — first one is the command, rest are treated as sub-commands
                    // For simplicity, treat additional G/M codes as separate instructions
                    // But first, push the current instruction
                    instructions.push({
                        lineNumber: lineNum,
                        command,
                        parameters: [...parameters],
                        comment: null,
                        raw,
                        blockDelete,
                    });
                    command = word;
                    parameters.length = 0;
                } else {
                    parameters.push(word);
                }

                continue;
            }

            if (token.type === "unknown") {
                errors.push({
                    line: lineNum,
                    column: token.column,
                    message: `Unexpected character: '${token.value}'`,
                });
            }
        }

        instructions.push({
            lineNumber: lineNum,
            command,
            parameters,
            comment,
            raw,
            blockDelete,
        });
    }

    return {
        instructions,
        errors,
        lineCount: lines.length,
    };
}

// Utility: get parameter value from an instruction
export function getParam(instruction: GCodeInstruction, letter: string): number | undefined {
    const param = instruction.parameters.find((p) => p.letter === letter.toUpperCase());
    return param?.value;
}

// Utility: get command string (e.g., "G0", "G1", "M3")
export function getCommandString(instruction: GCodeInstruction): string | null {
    if (!instruction.command) return null;
    const { letter, value } = instruction.command;
    return `${letter}${Math.floor(value)}`;
}
