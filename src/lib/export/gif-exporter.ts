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

    // Enter export mode
    store.startExport();

    try {
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
            frames.push(canvas.toDataURL("image/png"));

            // Update progress (first 50% is capturing)
            const progress = Math.floor((frames.length / totalSteps) * 50);
            store.updateExportProgress(progress);
        }

        // Create the GIF using gifshot
        gifshot.createGIF(
            {
                images: frames,
                gifWidth: canvas.width,
                gifHeight: canvas.height,
                interval: 0.1, // 10 FPS
                numWorkers: 2,
            },
            (obj: { error: boolean; image: string; errorCode: string; errorMsg: string }) => {
                if (!obj.error) {
                    const link = document.createElement("a");
                    link.href = obj.image;
                    link.download = `simulation_${new Date().getTime()}.gif`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    console.error("GIF Export failed:", obj.errorMsg);
                    alert(`Export failed: ${obj.errorMsg}`);
                }
                store.finishExport();
            }
        );

        // gifshot doesn't provide granular progress during encoding in a simple way
        // So we just set it to 100% when encoding is done (handled in callback)
        store.updateExportProgress(100);

    } catch (error) {
        console.error("Export process error:", error);
        alert("An error occurred during export.");
        store.finishExport();
    }
}
