import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "WebGCode 2",
        short_name: "WebGCode",
        description: "Professional G-code Editor and 3D Simulator",
        start_url: "/",
        display: "standalone",
        background_color: "#0F1216",
        theme_color: "#3B82F6",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    };
}
