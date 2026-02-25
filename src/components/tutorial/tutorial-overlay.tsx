"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TUTORIAL_STEPS, TARGET_SELECTORS, TutorialStepConfig } from "@/lib/tutorial/steps";
import { useTutorialStore } from "@/store/tutorial";
import { useAppStore } from "@/store";

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

function findTarget(step: TutorialStepConfig): HTMLElement | null {
    if (step.target === "none") return null;
    const selector = TARGET_SELECTORS[step.target];
    return document.querySelector(selector);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getPanelPosition(targetRect: Rect | null) {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const panelW = 360;
    const panelH = 200;
    const margin = 16;

    if (!targetRect) {
        return {
            top: clamp((viewportH - panelH) / 2, margin, viewportH - panelH - margin),
            left: clamp((viewportW - panelW) / 2, margin, viewportW - panelW - margin),
        };
    }

    const preferredBelow = targetRect.top + targetRect.height + 12;
    const preferredRight = targetRect.left;
    const top =
        preferredBelow + panelH + margin <= viewportH
            ? preferredBelow
            : clamp(targetRect.top - panelH - 12, margin, viewportH - panelH - margin);
    const left = clamp(preferredRight, margin, viewportW - panelW - margin);
    return { top, left };
}

export default function TutorialOverlay() {
    const initialized = useTutorialStore((s) => s.initialized);
    const active = useTutorialStore((s) => s.active);
    const hasSeen = useTutorialStore((s) => s.hasSeen);
    const currentStep = useTutorialStore((s) => s.currentStep);
    const actionCompleted = useTutorialStore((s) => s.actionCompleted);
    const initialize = useTutorialStore((s) => s.initialize);
    const next = useTutorialStore((s) => s.next);
    const prev = useTutorialStore((s) => s.prev);
    const exit = useTutorialStore((s) => s.exit);
    const complete = useTutorialStore((s) => s.complete);
    const markActionComplete = useTutorialStore((s) => s.markActionComplete);
    const playing = useAppStore((s) => s.simulation.playing);

    const step = TUTORIAL_STEPS[currentStep] ?? TUTORIAL_STEPS[0];
    const [targetRect, setTargetRect] = useState<Rect | null>(null);
    const rafRef = useRef<number | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!initialized) initialize();
    }, [initialize, initialized]);

    useEffect(() => {
        if (!active || !step.requiresAction) return;
        if (step.id === "runSimulation" && playing) {
            markActionComplete("runSimulation");
            const timer = setTimeout(() => next(), 250);
            return () => clearTimeout(timer);
        }
    }, [active, step, playing, markActionComplete, next]);

    useEffect(() => {
        if (!active) return;

        const updateRect = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const el = findTarget(step);
                if (!el) {
                    setTargetRect(null);
                    return;
                }
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top - 6,
                    left: rect.left - 6,
                    width: rect.width + 12,
                    height: rect.height + 12,
                });
            });
        };

        updateRect();
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);
        return () => {
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active, step]);

    useEffect(() => {
        if (!active) return;
        panelRef.current?.focus();
    }, [active, currentStep]);

    useEffect(() => {
        if (!active) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                exit();
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prev();
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                if (step.requiresAction && !actionCompleted[step.id]) return;
                if (step.id === "completion") {
                    complete();
                } else {
                    next();
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [active, actionCompleted, complete, exit, next, prev, step]);

    const panelPos = useMemo(() => getPanelPosition(targetRect), [targetRect]);
    const canProceed = !step.requiresAction || actionCompleted[step.id];
    const progressLabel = `${step.order} / ${TUTORIAL_STEPS.length}`;

    if (!initialized || hasSeen || !active) return null;

    return (
        <div className="fixed inset-0 z-[180] pointer-events-none" aria-live="polite">
            <div className="absolute inset-0 bg-black/45 motion-reduce:transition-none transition-opacity duration-150" />

            {targetRect && (
                <div
                    className="absolute rounded-md border-2 border-semantic-motion shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] motion-reduce:transition-none transition-all duration-150"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                />
            )}

            <div
                ref={panelRef}
                tabIndex={-1}
                className="absolute w-[360px] rounded-md border border-border-500 bg-bg-800 p-3 pointer-events-auto shadow-2xl outline-none"
                style={{ top: panelPos.top, left: panelPos.left }}
                role="dialog"
                aria-label="WebGCode tutorial"
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-code uppercase tracking-wider text-text-300">Calibration Guide</span>
                    <span className="text-[11px] font-code tabular-nums text-text-300">{progressLabel}</span>
                </div>
                <h3 className="text-sm font-ui font-semibold text-text-100">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-200">{step.message}</p>

                {step.requiresAction && !canProceed && (
                    <p className="mt-2 text-[11px] font-code text-semantic-warn">{step.actionLabel}</p>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-border-500 bg-bg-900 px-2 text-xs text-text-200"
                            onClick={prev}
                            disabled={currentStep === 0}
                        >
                            Back
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-border-500 bg-bg-900 px-2 text-xs text-text-200"
                            onClick={exit}
                        >
                            Exit
                        </Button>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={step.id === "completion" ? complete : next}
                        disabled={!canProceed}
                    >
                        {step.id === "completion" ? "Finish" : "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
