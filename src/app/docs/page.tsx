"use client";

import Link from "next/link";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type ReactNode,
} from "react";

type SectionId =
    | "overview"
    | "supported-gcode"
    | "simulation-model"
    | "machine-profiles"
    | "file-io"
    | "limitations"
    | "faq";

type DocSection = {
    id: SectionId;
    title: string;
    body: ReactNode;
};

const SECTION_ORDER: SectionId[] = [
    "overview",
    "supported-gcode",
    "simulation-model",
    "machine-profiles",
    "file-io",
    "limitations",
    "faq",
];

const LEFT_NAV_GROUPS = [
    {
        title: "Getting Started",
        items: [
            { id: "overview" as SectionId, label: "Overview" },
            { id: "supported-gcode" as SectionId, label: "Supported G-code" },
            { id: "simulation-model" as SectionId, label: "Simulation Model" },
        ],
    },
    {
        title: "Reference",
        items: [
            { id: "machine-profiles" as SectionId, label: "Machine Profiles" },
            { id: "file-io" as SectionId, label: "File Import / Export" },
            { id: "limitations" as SectionId, label: "Limitations" },
            { id: "faq" as SectionId, label: "FAQ" },
        ],
    },
];

const RIGHT_RAIL = [
    { id: "overview" as SectionId, label: "Overview" },
    { id: "supported-gcode" as SectionId, label: "Supported G-code" },
    { id: "simulation-model" as SectionId, label: "Simulation Model" },
    { id: "machine-profiles" as SectionId, label: "Machine Profiles" },
    { id: "file-io" as SectionId, label: "File Import / Export" },
    { id: "limitations" as SectionId, label: "Limitations" },
    { id: "faq" as SectionId, label: "FAQ" },
];

function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CodeBlock({ code, language = "text" }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-md border border-border-500 bg-bg-900">
            <div className="flex items-center justify-between border-b border-border-500 bg-bg-800 px-3 py-2">
                <span className="text-[11px] uppercase tracking-widest text-text-300 font-code">{language}</span>
                <button
                    onClick={onCopy}
                    className="text-[11px] uppercase tracking-widest text-text-300 hover:text-text-100 font-code"
                >
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-text-100">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function H2({ id, title }: { id: SectionId; title: string }) {
    return (
        <h2 id={id} className="scroll-mt-8 text-3xl font-ui font-semibold tracking-tight text-text-100">
            <a href={`#${id}`} className="group inline-flex items-center gap-2 hover:text-semantic-motion">
                {title}
                <span className="opacity-0 group-hover:opacity-100 text-sm text-text-300">#</span>
            </a>
        </h2>
    );
}

export default function DocsPage() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<SectionId>("overview");

    const sections = useMemo<DocSection[]>(
        () => [
            {
                id: "overview",
                title: "Overview",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <p>
                            WebGCode 2 is a local-only CNC engineering tool. Parser, validation, simulation, and rendering
                            run entirely in the browser runtime.
                        </p>
                        <p>
                            The editor text is the source contract. Everything downstream is deterministic projection:
                            diagnostics, toolpath segments, playback state, and visualization.
                        </p>
                    </div>
                ),
            },
            {
                id: "supported-gcode",
                title: "Supported G-code",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <p>Motion simulation is currently implemented for rapid, linear, and circular interpolation paths.</p>
                        <CodeBlock
                            language="gcode"
                            code={`G0  X10 Y10 Z5
G1  X50 Y10 F800
G2  X70 Y30 I10 J0
G3  X50 Y50 I0 J10
G90 ; absolute mode
G91 ; incremental mode`}
                        />
                        <p>
                            Additional setup/spindle codes are parsed and validated against the machine profile, but may be
                            non-geometric in current viewer output.
                        </p>
                    </div>
                ),
            },
            {
                id: "simulation-model",
                title: "Simulation Model",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <p>The engine is segment-based and line-mapped. Each segment keeps source line index, distance, and duration metadata.</p>
                        <CodeBlock
                            language="pipeline"
                            code={`Monaco Editor
 -> Parse (line tokenizer)
 -> Validate (machine constraints)
 -> Generate segments
 -> Build simulation steps
 -> Render in Three.js`}
                        />
                        <p>Playback and scrub operate over explicit indices for repeatable behavior across machines.</p>
                    </div>
                ),
            },
            {
                id: "machine-profiles",
                title: "Machine Profiles",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Axis bounds for X/Y/Z</li>
                            <li>Units (`mm`/`inch`)</li>
                            <li>Maximum feed and spindle constraints</li>
                            <li>Supported G/M command sets</li>
                        </ul>
                        <p>Profile edits re-run validation and simulation immediately against the current editor buffer.</p>
                    </div>
                ),
            },
            {
                id: "file-io",
                title: "File Import / Export",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <p>Supported export types: <code className="font-code text-text-100">.gcode .gc .ngc .txt</code>.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Import via browser File API only</li>
                            <li>Export via Blob + object URL + hidden anchor</li>
                            <li>Original line ending style (`LF` / `CRLF`) preserved</li>
                            <li>No comment removal and no formatting rewrite</li>
                        </ul>
                    </div>
                ),
            },
            {
                id: "limitations",
                title: "Limitations",
                body: (
                    <div className="space-y-4 text-base text-text-200 leading-8">
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Geometric simulation only, no material removal model</li>
                            <li>No collision solver or fixture collision analysis</li>
                            <li>Large file responsiveness depends on browser + GPU budget</li>
                        </ul>
                    </div>
                ),
            },
            {
                id: "faq",
                title: "FAQ",
                body: (
                    <div className="space-y-5 text-base text-text-200 leading-8">
                        <div>
                            <h3 className="text-text-100 font-ui font-semibold">Is any G-code transmitted to a server?</h3>
                            <p>No. The app is local-only at runtime.</p>
                        </div>
                        <div>
                            <h3 className="text-text-100 font-ui font-semibold">Why is a command flagged unsupported?</h3>
                            <p>The active machine profile defines allowed command lists.</p>
                        </div>
                    </div>
                ),
            },
        ],
        []
    );

    useEffect(() => {
        const root = scrollRef.current;
        if (!root) return;
        const nodes = SECTION_ORDER.map((id) => document.getElementById(id)).filter(
            (node): node is HTMLElement => Boolean(node)
        );
        if (nodes.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const inView = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (inView[0]) {
                    setActive(inView[0].target.id as SectionId);
                }
            },
            { root, threshold: [0.2, 0.6], rootMargin: "-15% 0px -65% 0px" }
        );

        nodes.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: SectionId) => (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        const target = document.getElementById(id);
        if (!target) return;
        target.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
        });
        history.replaceState(null, "", `#${id}`);
        setActive(id);
    };

    return (
        <div className="h-full min-h-0 bg-black text-text-100">
            <header className="h-14 border-b border-border-500 bg-black">
                <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5">
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-ui font-semibold tracking-tight">WebGCode Docs</span>
                        <span className="text-xs font-code text-text-300 uppercase tracking-widest">Local-Only</span>
                    </div>
                    <Link href="/" className="text-xs uppercase tracking-widest font-code text-semantic-motion hover:text-text-100">
                        Return to Editor
                    </Link>
                </div>
            </header>

            <div className="mx-auto flex h-[calc(100%-3.5rem)] min-h-0 max-w-[1400px]">
                <aside className="hidden w-72 shrink-0 border-r border-border-500 xl:block">
                    <div className="sticky top-0 h-full overflow-y-auto px-4 py-6">
                        {LEFT_NAV_GROUPS.map((group) => (
                            <div key={group.title} className="mb-6 border-b border-border-500 pb-4 last:border-0">
                                <h3 className="mb-2 text-xs font-code uppercase tracking-widest text-text-300">{group.title}</h3>
                                <nav className="space-y-1">
                                    {group.items.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={scrollTo(item.id)}
                                            className={`block rounded-sm px-2 py-1.5 text-sm ${
                                                active === item.id
                                                    ? "bg-bg-700 text-text-100"
                                                    : "text-text-300 hover:bg-bg-800 hover:text-text-100"
                                            }`}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        ))}
                    </div>
                </aside>

                <main
                    ref={scrollRef}
                    className="min-h-0 flex-1 overflow-y-auto px-6 py-8 motion-reduce:scroll-auto"
                    style={{ scrollBehavior: prefersReducedMotion() ? "auto" : "smooth" }}
                    tabIndex={0}
                >
                    <article className="mx-auto max-w-3xl">
                        <h1 className="text-5xl font-ui font-semibold tracking-tight text-text-100">WebGCode 2 Documentation</h1>
                        <p className="mt-3 text-sm text-text-300">Last updated February 25, 2026</p>
                        <div className="mt-6 border-t border-border-500 pt-8 space-y-14">
                            {sections.map((section) => (
                                <section key={section.id} className="space-y-4">
                                    <H2 id={section.id} title={section.title} />
                                    {section.body}
                                </section>
                            ))}
                        </div>
                    </article>
                </main>

                <aside className="hidden w-72 shrink-0 border-l border-border-500 2xl:block">
                    <div className="sticky top-0 px-5 py-8">
                        <h3 className="text-sm font-ui font-semibold text-text-100">On this page</h3>
                        <nav className="mt-3 space-y-1.5">
                            {RIGHT_RAIL.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={scrollTo(item.id)}
                                    className={`block text-sm ${
                                        active === item.id
                                            ? "text-text-100"
                                            : "text-text-300 hover:text-text-100"
                                    }`}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>
            </div>
        </div>
    );
}
