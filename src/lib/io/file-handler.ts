// File I/O Utility — Robust local file handling
// Pure browser-based APIs, no backend involvement

export const SUPPORTED_EXTENSIONS = [".gcode", ".gc", ".ngc", ".txt"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
export type LineEnding = "\n" | "\r\n";

const DEFAULT_EXTENSION: SupportedExtension = ".gcode";
const DEFAULT_BASENAME = "program";
const MAX_BASENAME_LENGTH = 96;

export interface FileLoadResult {
    content: string;
    filename: string;
    extension: SupportedExtension;
    lineEnding: LineEnding;
    error: string | null;
}

export interface SaveGCodeOptions {
    content: string;
    basename: string;
    extension: SupportedExtension;
    lineEnding?: LineEnding;
}

export interface SaveGCodeResult {
    ok: boolean;
    filename: string;
    error: string | null;
}

/**
 * Validates if the file extension is supported
 */
export function isSupportedExtension(filename: string): filename is `${string}${SupportedExtension}` {
    const ext = getExtension(filename);
    return ext !== null;
}

export function getExtension(filename: string): SupportedExtension | null {
    const ext = "." + (filename.split(".").pop() ?? "").toLowerCase();
    return SUPPORTED_EXTENSIONS.find((candidate) => candidate === ext) ?? null;
}

export function getBasename(filename: string): string {
    const ext = getExtension(filename);
    const withoutExt = ext ? filename.slice(0, -ext.length) : filename;
    return sanitizeBasename(withoutExt);
}

export function sanitizeBasename(raw: string): string {
    const cleaned = raw
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^\.+/, "")
        .replace(/\.+$/, "");

    const clipped = cleaned.slice(0, MAX_BASENAME_LENGTH);
    return clipped.length > 0 ? clipped : DEFAULT_BASENAME;
}

export function detectLineEnding(text: string): LineEnding {
    return text.includes("\r\n") ? "\r\n" : "\n";
}

function normalizeLineEndings(text: string, lineEnding: LineEnding): string {
    // Monaco models normalize to LF; export can restore original file EOL style.
    return text.replace(/\r?\n/g, lineEnding);
}

/**
 * Loads a file as plain text
 */
export async function loadGCodeFile(file: File): Promise<FileLoadResult> {
    const extension = getExtension(file.name);
    if (!extension) {
        return {
            content: "",
            filename: file.name,
            extension: DEFAULT_EXTENSION,
            lineEnding: "\n",
            error: `Unsupported file extension: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
        };
    }

    try {
        const content = await file.text();
        return {
            content,
            filename: file.name,
            extension,
            lineEnding: detectLineEnding(content),
            error: null,
        };
    } catch (err) {
        return {
            content: "",
            filename: file.name,
            extension,
            lineEnding: "\n",
            error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

/**
 * Saves content to a local file using Blob and createObjectURL
 */
export function saveGCodeFile(options: SaveGCodeOptions): SaveGCodeResult {
    const basename = sanitizeBasename(options.basename);
    const extension = SUPPORTED_EXTENSIONS.includes(options.extension)
        ? options.extension
        : DEFAULT_EXTENSION;
    const filename = `${basename}${extension}`;

    if (options.content.length === 0) {
        return {
            ok: false,
            filename,
            error: "Cannot export an empty file.",
        };
    }

    try {
        const lineEnding = options.lineEnding ?? "\n";
        const normalized = normalizeLineEndings(options.content, lineEnding);
        const blob = new Blob([normalized], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { ok: true, filename, error: null };
    } catch (error) {
        return {
            ok: false,
            filename,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
