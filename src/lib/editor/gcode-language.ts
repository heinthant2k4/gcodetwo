// G-code Monarch Language Definition for Monaco Editor
// Syntax highlighting: G commands, M commands, parameters, comments, line numbers

import type { languages } from "monaco-editor";

export const gcodeLanguageId = "gcode";

export const gcodeLanguageConfig: languages.LanguageConfiguration = {
    comments: {
        lineComment: ";",
        blockComment: ["(", ")"],
    },
    brackets: [],
    autoClosingPairs: [{ open: "(", close: ")" }],
    surroundingPairs: [{ open: "(", close: ")" }],
};

export const gcodeMonarchTokens: languages.IMonarchLanguage = {
    defaultToken: "",
    ignoreCase: true,

    tokenizer: {
        root: [
            // Block delete
            [/^\//, "comment.block-delete"],

            // Line numbers
            [/[Nn]\d+/, "number.line-number"],

            // Semicolon comments
            [/;.*$/, "comment"],

            // Parenthesis comments
            [/\(/, "comment", "@comment"],

            // G commands — rapid/linear
            [/[Gg]\s*0(?!\d)/, "keyword.rapid"],
            [/[Gg]\s*1(?!\d)/, "keyword.linear"],

            // G commands — arcs
            [/[Gg]\s*[23](?!\d)/, "keyword.arc"],

            // G commands — other
            [/[Gg]\s*\d+\.?\d*/, "keyword.gcode"],

            // M commands
            [/[Mm]\s*\d+\.?\d*/, "keyword.mcode"],

            // Parameters with values
            [/[Xx]\s*[\-+]?\d+\.?\d*/, "variable.x"],
            [/[Yy]\s*[\-+]?\d+\.?\d*/, "variable.y"],
            [/[Zz]\s*[\-+]?\d+\.?\d*/, "variable.z"],
            [/[Ff]\s*[\-+]?\d+\.?\d*/, "variable.feed"],
            [/[Ss]\s*[\-+]?\d+\.?\d*/, "variable.spindle"],
            [/[IiJjKk]\s*[\-+]?\d+\.?\d*/, "variable.arc-param"],
            [/[RrPpQqLlHhDd]\s*[\-+]?\d+\.?\d*/, "variable.param"],
            [/[Tt]\s*\d+/, "variable.tool"],

            // Numbers
            [/[\-+]?\d+\.?\d*/, "number"],

            // Percent
            [/%/, "delimiter.percent"],

            // Whitespace
            [/\s+/, "white"],
        ],

        comment: [
            [/[^)]+/, "comment"],
            [/\)/, "comment", "@pop"],
        ],
    },
};

// Custom theme for G-code that uses our design tokens
export const gcodeThemeData = {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
        { token: "comment", foreground: "7C828D", fontStyle: "italic" },
        { token: "comment.block-delete", foreground: "7C828D" },
        { token: "keyword.rapid", foreground: "3B82F6", fontStyle: "bold" },
        { token: "keyword.linear", foreground: "22C55E", fontStyle: "bold" },
        { token: "keyword.arc", foreground: "FACC15", fontStyle: "bold" },
        { token: "keyword.gcode", foreground: "3B82F6" },
        { token: "keyword.mcode", foreground: "EF4444" },
        { token: "variable.x", foreground: "E6E9EE" },
        { token: "variable.y", foreground: "E6E9EE" },
        { token: "variable.z", foreground: "E6E9EE" },
        { token: "variable.feed", foreground: "FACC15" },
        { token: "variable.spindle", foreground: "EF4444" },
        { token: "variable.arc-param", foreground: "B8BDC6" },
        { token: "variable.param", foreground: "B8BDC6" },
        { token: "variable.tool", foreground: "22C55E" },
        { token: "number", foreground: "B8BDC6" },
        { token: "number.line-number", foreground: "7C828D" },
        { token: "delimiter.percent", foreground: "7C828D" },
        { token: "", foreground: "E6E9EE" },
    ],
    colors: {
        "editor.background": "#0F1216",
        "editor.foreground": "#E6E9EE",
        "editor.lineHighlightBackground": "#1E232B",
        "editor.selectionBackground": "#2A2F3880",
        "editorCursor.foreground": "#3B82F6",
        "editorLineNumber.foreground": "#7C828D",
        "editorLineNumber.activeForeground": "#B8BDC6",
        "editor.selectionHighlightBackground": "#2A2F3850",
        "editorGutter.background": "#161A20",
        "editorOverviewRuler.border": "#2A2F38",
        "editorWidget.background": "#161A20",
        "editorWidget.border": "#2A2F38",
        "input.background": "#1E232B",
        "input.foreground": "#E6E9EE",
        "input.border": "#2A2F38",
    },
};
