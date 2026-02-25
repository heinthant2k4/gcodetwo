export type TutorialStepId =
    | "orientation"
    | "editor"
    | "fileControls"
    | "viewer"
    | "playback"
    | "machineProfile"
    | "runSimulation"
    | "completion";

export type TutorialTarget =
    | "appShell"
    | "editor"
    | "fileControls"
    | "viewer"
    | "playbackControls"
    | "machineProfile"
    | "playButton"
    | "none";

export interface TutorialStepConfig {
    id: TutorialStepId;
    order: number;
    target: TutorialTarget;
    title: string;
    message: string;
    requiresAction?: boolean;
    actionLabel?: string;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
    {
        id: "orientation",
        order: 1,
        target: "appShell",
        title: "Orientation",
        message:
            "WebGCode simulates CNC toolpaths directly from G-code. Everything you see is generated from the editor.",
    },
    {
        id: "editor",
        order: 2,
        target: "editor",
        title: "G-code Editor",
        message:
            "This is the source of truth. Editing code here immediately updates the simulation.",
    },
    {
        id: "fileControls",
        order: 3,
        target: "fileControls",
        title: "Load / Save Files",
        message:
            "You can load or export G-code files. Processing stays entirely in your browser.",
    },
    {
        id: "viewer",
        order: 4,
        target: "viewer",
        title: "Simulation View",
        message:
            "This view renders the toolpath geometry derived from the G-code.",
    },
    {
        id: "playback",
        order: 5,
        target: "playbackControls",
        title: "Playback Controls",
        message:
            "Playback simulates execution order. It does not control real machines.",
    },
    {
        id: "machineProfile",
        order: 6,
        target: "machineProfile",
        title: "Machine Profile",
        message:
            "Machine profiles define limits and units. They affect simulation only.",
    },
    {
        id: "runSimulation",
        order: 7,
        target: "playButton",
        title: "Run First Simulation",
        message:
            "Run the toolpath to complete setup.",
        requiresAction: true,
        actionLabel: "Press Play to continue",
    },
    {
        id: "completion",
        order: 8,
        target: "none",
        title: "Completion",
        message:
            "Setup complete. You are now operating in live mode.",
    },
];

export const TARGET_SELECTORS: Record<Exclude<TutorialTarget, "none">, string> = {
    appShell: "#app-shell",
    editor: "#editor-panel",
    fileControls: '[data-tutorial="file-controls"]',
    viewer: "#viewer-panel",
    playbackControls: "#playback-controls",
    machineProfile: "#machine-profile-panel",
    playButton: "#tutorial-play-button",
};
