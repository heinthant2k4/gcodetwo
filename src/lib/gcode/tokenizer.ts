// G-code Tokenizer
// Deterministic line-by-line tokenizer — pure function, no mutation

import { Token } from "@/lib/types/gcode";

export function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
        // Skip whitespace
        if (line[i] === " " || line[i] === "\t") {
            i++;
            continue;
        }

        // Block delete
        if (line[i] === "/" && i === 0) {
            tokens.push({
                type: "unknown",
                value: "/",
                raw: "/",
                column: i,
            });
            i++;
            continue;
        }

        // Semicolon comment — rest of line
        if (line[i] === ";") {
            const comment = line.slice(i + 1).trim();
            tokens.push({
                type: "comment",
                value: comment,
                raw: line.slice(i),
                column: i,
            });
            break;
        }

        // Parenthesis comment
        if (line[i] === "(") {
            const end = line.indexOf(")", i);
            if (end !== -1) {
                const comment = line.slice(i + 1, end).trim();
                tokens.push({
                    type: "comment",
                    value: comment,
                    raw: line.slice(i, end + 1),
                    column: i,
                });
                i = end + 1;
            } else {
                // Unclosed parenthesis — treat rest as comment
                const comment = line.slice(i + 1).trim();
                tokens.push({
                    type: "comment",
                    value: comment,
                    raw: line.slice(i),
                    column: i,
                });
                break;
            }
            continue;
        }

        // Percent sign (program delimiters)
        if (line[i] === "%") {
            tokens.push({
                type: "unknown",
                value: "%",
                raw: "%",
                column: i,
            });
            i++;
            continue;
        }

        // Line number (N word)
        if (line[i] === "N" || line[i] === "n") {
            const start = i;
            i++;
            let numStr = "";
            while (i < line.length && (line[i] >= "0" && line[i] <= "9")) {
                numStr += line[i];
                i++;
            }
            if (numStr.length > 0) {
                tokens.push({
                    type: "lineNumber",
                    value: numStr,
                    raw: line.slice(start, i),
                    column: start,
                });
            } else {
                // N without number — treat as word
                i = start;
                const wordToken = readWord(line, i);
                if (wordToken) {
                    tokens.push(wordToken);
                    i = start + wordToken.raw.length;
                } else {
                    i++;
                }
            }
            continue;
        }

        // Word (letter + number)
        if (isLetter(line[i])) {
            const wordToken = readWord(line, i);
            if (wordToken) {
                tokens.push(wordToken);
                i += wordToken.raw.length;
            } else {
                tokens.push({
                    type: "unknown",
                    value: line[i],
                    raw: line[i],
                    column: i,
                });
                i++;
            }
            continue;
        }

        // Unknown character
        tokens.push({
            type: "unknown",
            value: line[i],
            raw: line[i],
            column: i,
        });
        i++;
    }

    return tokens;
}

function readWord(line: string, start: number): Token | null {
    if (!isLetter(line[start])) return null;

    const letter = line[start].toUpperCase();
    let i = start + 1;

    // Skip whitespace between letter and number
    while (i < line.length && (line[i] === " " || line[i] === "\t")) {
        i++;
    }

    // Read number (optional sign, digits, optional decimal)
    let numStr = "";
    if (i < line.length && (line[i] === "-" || line[i] === "+")) {
        numStr += line[i];
        i++;
    }

    let hasDigit = false;
    while (i < line.length && line[i] >= "0" && line[i] <= "9") {
        numStr += line[i];
        i++;
        hasDigit = true;
    }

    if (i < line.length && line[i] === ".") {
        numStr += line[i];
        i++;
        while (i < line.length && line[i] >= "0" && line[i] <= "9") {
            numStr += line[i];
            i++;
            hasDigit = true;
        }
    }

    if (!hasDigit) return null;

    return {
        type: "word",
        value: letter + numStr,
        raw: line.slice(start, i),
        column: start,
    };
}

function isLetter(ch: string): boolean {
    return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
}
