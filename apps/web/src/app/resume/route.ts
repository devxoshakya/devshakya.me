import fs from "fs";
import path from "path";

const RESUME_DIR = path.join(process.cwd(), "public", "resume");

/**
 * Serves the single PDF found in `public/resume` at `/resume`,
 * regardless of its filename.
 */
export const GET = () => {
    const file = fs
        .readdirSync(RESUME_DIR)
        .find((name) => name.toLowerCase().endsWith(".pdf"));

    if (!file) {
        return new Response("Resume not found", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
        });
    }

    const pdf = fs.readFileSync(path.join(RESUME_DIR, file));

    return new Response(new Uint8Array(pdf), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
        },
    });
};
