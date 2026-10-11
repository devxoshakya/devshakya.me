import { encode } from "blurhash";

// Longest side of the sampled image. 64px is plenty for a blur hash and keeps encoding instant.
const SAMPLE_SIDE = 64;
// Matches the API limit for width/height.
const MAX_DIMENSION = 20_000;

export interface ImageMeta {
    width: number;
    height: number;
    blurHash: string;
}

// More components for better detail, shaped by the aspect ratio so landscape images
// get more horizontal detail and portrait images more vertical detail.
// Square = 5x5, 16:9 = 7x4, 9:16 = 4x7. Max 7x4 or similar keeps the hash well under 100 chars.
function componentsFor(aspect: number): [number, number] {
    const pick = (value: number) => Math.min(7, Math.max(3, Math.round(value)));
    return [pick(5 * Math.sqrt(aspect)), pick(5 / Math.sqrt(aspect))];
}

function context2d(canvas: HTMLCanvasElement, readback = false) {
    const ctx = canvas.getContext("2d", readback ? { willReadFrequently: true } : undefined);
    if (!ctx) {
        throw new Error("Canvas is not available in this browser");
    }
    ctx.imageSmoothingQuality = "high";
    return ctx;
}

// Downscale in halving steps, then a final draw. A single huge-to-tiny draw
// aliases and gives noisy, lower quality hashes.
function sample(bitmap: ImageBitmap, width: number, height: number): ImageData {
    let source: CanvasImageSource = bitmap;
    let sw = bitmap.width;
    let sh = bitmap.height;

    while (sw >= width * 2 && sh >= height * 2) {
        const nw = Math.max(width, Math.floor(sw / 2));
        const nh = Math.max(height, Math.floor(sh / 2));
        const step = document.createElement("canvas");
        step.width = nw;
        step.height = nh;
        context2d(step).drawImage(source, 0, 0, nw, nh);
        source = step;
        sw = nw;
        sh = nh;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = context2d(canvas, true);
    // Blur hash ignores alpha, so composite transparent images on white first.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
}

/** Reads dimensions (EXIF-corrected) and generates a blur hash. Throws a readable Error on failure. */
export async function readImage(file: File): Promise<ImageMeta> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        throw new Error("This browser could not decode the image");
    }

    try {
        const { width, height } = bitmap;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            throw new Error(`Image is larger than ${MAX_DIMENSION}px on one side`);
        }

        const scale = Math.min(1, SAMPLE_SIDE / Math.max(width, height));
        const sw = Math.max(1, Math.round(width * scale));
        const sh = Math.max(1, Math.round(height * scale));
        const [cx, cy] = componentsFor(width / height);

        const { data } = sample(bitmap, sw, sh);
        return { width, height, blurHash: encode(data, sw, sh, cx, cy) };
    } finally {
        bitmap.close();
    }
}