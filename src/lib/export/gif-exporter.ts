// @ts-expect-error gifshot has no shipped types in this project setup.
import gifshot from "gifshot";
import { useAppStore } from "@/store";

/**
 * Exports the current toolpath simulation as a GIF.
 * Captures frames deterministically from the Three.js canvas.
 */
export async function exportSimulationAsGif(canvas: HTMLCanvasElement) {
    const store = useAppStore.getState();
    const segments = store.simulationData.segments;

    if (segments.length === 0) {
        alert("No toolpath data to export.");
        return;
    }

    const previousStep = store.simulation.currentStepIndex;
    const wasPlaying = store.simulation.playing;
    if (wasPlaying) {
        store.pause();
    }

    // Enter export mode
    store.startExport();

    try {
        if (canvas.width === 0 || canvas.height === 0) {
            alert("Export failed: viewer canvas is not ready.");
            return;
        }

        const frames: string[] = [];

        // Target around 50-100 frames for the GIF to keep size reasonable
        const targetFrames = 60;
        const stepSize = Math.max(1, Math.floor(segments.length / targetFrames));

        const totalSteps = Math.ceil(segments.length / stepSize);

        for (let i = 0; i <= segments.length; i += stepSize) {
            // Synchronously update the simulation state
            store.jumpToStep(i);

            // Wait for React to propagates state and Three.js to render
            // We use multiple animation frames to ensure the GPU has finished rendering the current state
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));

            // Capture the current frame
            try {
                frames.push(canvas.toDataURL("image/png"));
            } catch {
                alert("Export failed: unable to read viewer buffer.");
                return;
            }

            // Update progress (first 50% is capturing)
            const progress = Math.floor((frames.length / totalSteps) * 50);
            store.updateExportProgress(progress);
        }

        const result = await new Promise<{ image: string }>((resolve, reject) => {
            gifshot.createGIF(
                {
                    images: frames,
                    gifWidth: canvas.width,
                    gifHeight: canvas.height,
                    interval: 0.1, // 10 FPS
                    numWorkers: 2,
                },
                (obj: { error?: boolean; image?: string; errorCode?: string; errorMsg?: string }) => {
                    if (!obj.error && obj.image) {
                        resolve({ image: obj.image });
                        return;
                    }

                    const msg =
                        obj.errorMsg?.trim() ||
                        obj.errorCode?.trim() ||
                        "GIF encoder returned an unknown error.";
                    reject(new Error(msg));
                }
            );
        });

        store.updateExportProgress(100);
        const link = document.createElement("a");
        link.href = result.image;
        link.download = `simulation_${Date.now()}.gif`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Export process error:", error);
        const message = error instanceof Error && error.message
            ? error.message
            : "An unknown export error occurred.";
        alert(`Export failed: ${message}`);
    } finally {
        store.jumpToStep(previousStep);
        if (wasPlaying) {
            store.play();
        }
        store.finishExport();
    }
}
