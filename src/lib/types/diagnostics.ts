// Diagnostic Type Definitions

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
    severity: DiagnosticSeverity;
    line: number;
    column: number;
    endColumn: number;
    message: string;
    ruleId: string;
}

export interface ValidationResult {
    diagnostics: Diagnostic[];
    errorCount: number;
    warningCount: number;
    infoCount: number;
    isValid: boolean;
}
