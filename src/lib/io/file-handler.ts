// File I/O Utility — Robust local file handling
// Supports .gcode, .gc, .ngc, .cnc, .txt
// Pure browser-based APIs, no backend involvement

const SUPPORTED_EXTENSIONS = [".gcode", ".gc", ".ngc", ".cnc", ".txt"];

export interface FileLoadResult {
    content: string;
    filename: string;
    error: string | null;
}

/**
 * Validates if the file extension is supported
 */
export function isSupportedExtension(filename: string): boolean {
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Loads a file as plain text
 */
export async function loadGCodeFile(file: File): Promise<FileLoadResult> {
    if (!isSupportedExtension(file.name)) {
        return {
            content: "",
            filename: file.name,
            error: `Unsupported file extension: ${file.name}. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
        };
    }

    try {
        const content = await file.text();
        return {
            content,
            filename: file.name,
            error: null,
        };
    } catch (err) {
        return {
            content: "",
            filename: file.name,
            error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

/**
 * Saves content to a local file using Blob and createObjectURL
 */
export function saveGCodeFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}
