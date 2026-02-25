// G-code Type Definitions
// Structured representation of parsed G-code

export interface Token {
    type: "word" | "comment" | "lineNumber" | "unknown";
    value: string;
    raw: string;
    column: number;
}

export interface GCodeWord {
    letter: string;
    value: number;
    raw: string;
}

export interface GCodeInstruction {
    lineNumber: number; // 1-based source line
    command: GCodeWord | null;
    parameters: GCodeWord[];
    comment: string | null;
    raw: string;
    blockDelete: boolean;
}

export interface ParseError {
    line: number;
    column: number;
    message: string;
}

export interface ParseResult {
    instructions: GCodeInstruction[];
    errors: ParseError[];
    lineCount: number;
}
