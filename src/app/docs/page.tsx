"use client";

import Link from "next/link";

export default function DocsPage() {
    return (
        <div className="h-full bg-bg-900 overflow-y-auto selection:bg-semantic-motion selection:text-white">
            <div className="text-text-200 font-ui p-8 max-w-4xl mx-auto leading-relaxed">
                <nav className="mb-12 border-b border-border-500 pb-4">
                    <Link href="/" className="text-semantic-motion hover:text-text-100 transition-colors text-sm uppercase tracking-widest font-code">
                        &larr; Return to Editor
                    </Link>
                </nav>

                <header className="mb-12">
                    <h1 className="text-3xl font-code text-text-100 mb-2 uppercase tracking-tight">Technical Documentation</h1>
                    <p className="text-text-300 text-sm italic">Revision 2.0.4 | WebGCode Engineering Manual</p>
                </header>

                <section className="space-y-12">
                    <article>
                        <h2 className="text-xl font-code text-text-100 mb-4 border-l-4 border-semantic-motion pl-4">1. Technical Overview (G-code Viewer)</h2>
                        <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                            <li>WebGCode 2 is a professional, browser-based G-code viewer and editor designed for CNC toolpath simulation.</li>
                            <li>It is not a SaaS, cloud service, or remote processing platform.</li>
                            <li>All execution, parsing, and rendering occur strictly within the local browser environment (local-only).</li>
                            <li>Zero-data transmission guarantee: no code is sent to external servers.</li>
                        </ul>
                    </article>

                    <article>
                        <h2 className="text-xl font-code text-text-100 mb-4 border-l-4 border-semantic-motion pl-4">2. Supported G-code Commands (CNC Toolpaths)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
                            <div>
                                <p className="text-sm mb-4">The engine parses ISO standard G-code commands for deterministic CNC toolpath visualization.</p>
                                <h3 className="text-xs uppercase tracking-widest text-text-300 mb-2 font-bold">Movement Commands</h3>
                                <ul className="list-none space-y-1 text-sm">
                                    <li><code className="bg-bg-800 px-1 rounded text-semantic-motion">G0</code> - Rapid Positioning</li>
                                    <li><code className="bg-bg-800 px-1 rounded text-semantic-motion">G1</code> - Linear Interpolation</li>
                                    <li><code className="bg-bg-800 px-1 rounded text-semantic-motion">G2</code> - Circular Interpolation (CW)</li>
                                    <li><code className="bg-bg-800 px-1 rounded text-semantic-motion">G3</code> - Circular Interpolation (CCW)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-text-300 mb-2 font-bold">Modal & Spindle</h3>
                                <ul className="list-none space-y-1 text-sm">
                                    <li><code className="bg-bg-800 px-1 rounded text-text-100">G20/G21</code> - Units (Inch/mm)</li>
                                    <li><code className="bg-bg-800 px-1 rounded text-text-100">G90/G91</code> - Positioning (Abs/Inc)</li>
                                    <li><code className="bg-bg-800 px-1 rounded text-text-100">M3/M4/M5</code> - Spindle Control</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 ml-4">
                            <h3 className="text-xs uppercase tracking-widest text-text-300 mb-2 font-bold">Ignored Commands</h3>
                            <p className="text-sm text-text-300 mb-2">The following are parsed but ignored in the current simulation engine:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-text-300">
                                <li>Canned Cycles (G80-G89)</li>
                                <li>Tool Length Compensation (G43)</li>
                                <li>Work Coordinate Systems (G54-G59)</li>
                                <li>Dwell (G4)</li>
                            </ul>
                        </div>
                    </article>

                    <article>
                        <h2 className="text-xl font-code text-text-100 mb-4 border-l-4 border-semantic-motion pl-4">3. Browser-Based Simulation Model</h2>
                        <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                            <li>The system utilizes a browser-based, step-deterministic simulation model derived from geometric segments.</li>
                            <li>Playback is deterministic; the position at any timestamp is computed via a fixed state-contract.</li>
                            <li>Visual representation is an approximation only.</li>
                            <li>The engine does not simulate physics, tool deflection, or material removal.</li>
                        </ul>
                    </article>

                    <article>
                        <h2 className="text-xl font-code text-text-100 mb-4 border-l-4 border-semantic-motion pl-4">4. Local-Only File I/O & Handling</h2>
                        <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                            <li>WebGCode 2 handles CNC G-code file I/O strictly in a local-only manner, preserving raw text integrity.</li>
                            <li>Supported extensions: <code className="text-text-100">.gcode, .gc, .ngc, .cnc, .txt</code></li>
                            <li>The tool handles files as absolute plain-text; encoding is assumed to be UTF-8.</li>
                            <li>No automatic code formatting is applied during import.</li>
                            <li>Exported files do not contain injected metadata or identifiers.</li>
                        </ul>
                    </article>

                    <article>
                        <h2 className="text-xl font-code text-text-100 mb-4 border-l-4 border-semantic-motion pl-4">5. Simulation Export (GIF)</h2>
                        <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                            <li>The simulation export utility provides a deterministic frame-capture mechanism for CNC toolpath visualization.</li>
                            <li>Export format is fixed to GIF.</li>
                            <li>Frame capture is deterministic; frames are triggered at discrete simulation steps.</li>
                            <li>Resulting media is a visual-only representation without embedded telemetry data.</li>
                        </ul>
                    </article>

                    <article className="border-t border-border-500 pt-8 mt-12">
                        <h2 className="text-xl font-code text-semantic-error mb-4 border-l-4 border-semantic-error pl-4 uppercase">6. Known Limitations</h2>
                        <ul className="list-disc list-inside space-y-2 text-sm ml-4 text-text-300">
                            <li>Geometric visualization only: no kerf or tool diameter offset rendering.</li>
                            <li>Unsupported coordinate offsets will result in visual shifts from nominal zeros.</li>
                            <li>Performance is limited by browser-based WebGL and client-side hardware capabilities.</li>
                            <li>No collision detection or tool-holder interference monitoring.</li>
                        </ul>
                    </article>
                </section>

                <footer className="mt-20 pt-8 border-t border-border-500 text-[10px] uppercase tracking-[0.2em] text-center text-text-300">
                    End of Documentation | WebGCode Engineering
                </footer>
            </div>
        </div>
    );
}
