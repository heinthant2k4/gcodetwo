"use client";

// Diagnostics Panel
// Scrollable list of diagnostics with severity icons and line numbers
// Click → jump to line in editor

import { useAppStore, selectDiagnostics, selectErrorCount, selectWarningCount } from "@/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Diagnostic, DiagnosticSeverity } from "@/lib/types/diagnostics";

function SeverityIcon({ severity }: { severity: DiagnosticSeverity }) {
    if (severity === "error") {
        return (
            <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
                <circle cx="6" cy="6" r="5" fill="none" stroke="#EF4444" strokeWidth="1.5" />
                <line x1="4" y1="4" x2="8" y2="8" stroke="#EF4444" strokeWidth="1.5" />
                <line x1="8" y1="4" x2="4" y2="8" stroke="#EF4444" strokeWidth="1.5" />
            </svg>
        );
    }
    if (severity === "warning") {
        return (
            <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
                <polygon points="6,1 11,11 1,11" fill="none" stroke="#FACC15" strokeWidth="1.2" />
                <line x1="6" y1="4.5" x2="6" y2="7.5" stroke="#FACC15" strokeWidth="1.2" />
                <circle cx="6" cy="9" r="0.6" fill="#FACC15" />
            </svg>
        );
    }
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
            <circle cx="6" cy="6" r="5" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
            <line x1="6" y1="5" x2="6" y2="8" stroke="#3B82F6" strokeWidth="1.2" />
            <circle cx="6" cy="3.5" r="0.6" fill="#3B82F6" />
        </svg>
    );
}

function DiagnosticRow({ diagnostic }: { diagnostic: Diagnostic }) {
    const handleClick = () => {
        const jumpFn = (window as unknown as Record<string, unknown>).__gcodeEditorJumpToLine;
        if (typeof jumpFn === "function") {
            (jumpFn as (line: number) => void)(diagnostic.line);
        }
    };

    const severityColor =
        diagnostic.severity === "error"
            ? "text-semantic-error"
            : diagnostic.severity === "warning"
                ? "text-semantic-warn"
                : "text-semantic-motion";

    return (
        <button
            onClick={handleClick}
            className="flex items-start gap-2 w-full px-3 py-1.5 text-left hover:bg-bg-700 text-sm transition-colors"
        >
            <div className="mt-0.5">
                <SeverityIcon severity={diagnostic.severity} />
            </div>
            <span className="font-code text-xs text-text-300 min-w-[36px] tabular-nums">
                L{diagnostic.line}
            </span>
            <span className={`text-xs ${severityColor} flex-1`}>
                {diagnostic.message}
            </span>
            <span className="text-xs text-text-300 font-code opacity-60">
                {diagnostic.ruleId}
            </span>
        </button>
    );
}

export default function DiagnosticsPanel() {
    const diagnostics = useAppStore(selectDiagnostics);
    const errorCount = useAppStore(selectErrorCount);
    const warningCount = useAppStore(selectWarningCount);

    return (
        <div className="flex flex-col h-full" id="diagnostics-panel">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-500 bg-bg-800">
                <span className="text-xs font-ui text-text-200 uppercase tracking-wider">
                    Diagnostics
                </span>
                <div className="flex items-center gap-2">
                    {errorCount > 0 && (
                        <span className="flex items-center gap-1 text-xs font-code text-semantic-error tabular-nums">
                            <SeverityIcon severity="error" />
                            {errorCount}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="flex items-center gap-1 text-xs font-code text-semantic-warn tabular-nums">
                            <SeverityIcon severity="warning" />
                            {warningCount}
                        </span>
                    )}
                    {errorCount === 0 && warningCount === 0 && (
                        <span className="text-xs text-semantic-safe font-code">
                            No issues
                        </span>
                    )}
                </div>
            </div>

            {/* Diagnostic list */}
            <ScrollArea className="flex-1">
                <div className="divide-y divide-border-500">
                    {diagnostics.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-xs text-text-300">
                            No diagnostics to display
                        </div>
                    ) : (
                        diagnostics.map((d, i) => (
                            <DiagnosticRow key={`${d.line}-${d.ruleId}-${i}`} diagnostic={d} />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
