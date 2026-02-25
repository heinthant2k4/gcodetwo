"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { TUTORIAL_STEPS, TutorialStepId } from "@/lib/tutorial/steps";

interface TutorialState {
    active: boolean;
    hasSeen: boolean;
    currentStep: number;
    actionCompleted: Record<TutorialStepId, boolean>;
    initialized: boolean;
    initialize: () => void;
    next: () => void;
    prev: () => void;
    exit: () => void;
    restart: () => void;
    complete: () => void;
    markActionComplete: (step: TutorialStepId) => void;
}

const initialActions: Record<TutorialStepId, boolean> = {
    orientation: false,
    editor: false,
    fileControls: false,
    viewer: false,
    playback: false,
    machineProfile: false,
    runSimulation: false,
    completion: false,
};

export const useTutorialStore = create<TutorialState>()(
    persist(
        (set, get) => ({
            active: false,
            hasSeen: false,
            currentStep: 0,
            actionCompleted: initialActions,
            initialized: false,
            initialize: () => {
                const seen = localStorage.getItem("webgcode_has_seen_tutorial") === "true";
                const step = Math.max(0, Math.min(get().currentStep, TUTORIAL_STEPS.length - 1));

                set({
                    initialized: true,
                    hasSeen: seen,
                    active: !seen,
                    currentStep: step,
                });
            },
            next: () =>
                set((s) => ({
                    currentStep: Math.min(s.currentStep + 1, TUTORIAL_STEPS.length - 1),
                })),
            prev: () =>
                set((s) => ({
                    currentStep: Math.max(s.currentStep - 1, 0),
                })),
            exit: () => set({ active: false }),
            restart: () =>
                set({
                    active: true,
                    hasSeen: false,
                    currentStep: 0,
                    actionCompleted: { ...initialActions },
                }),
            complete: () => {
                localStorage.setItem("webgcode_has_seen_tutorial", "true");
                set({
                    active: false,
                    hasSeen: true,
                    currentStep: TUTORIAL_STEPS.length - 1,
                });
            },
            markActionComplete: (step) =>
                set((s) => ({
                    actionCompleted: { ...s.actionCompleted, [step]: true },
                })),
        }),
        {
            name: "webgcode_tutorial_state",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                currentStep: s.currentStep,
                actionCompleted: s.actionCompleted,
            }),
        }
    )
);
