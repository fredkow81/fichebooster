const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image, matches typical vision API limits
const MAX_IMAGES = 5;

export interface EncodedImage {
  mediaType: string;
  base64: string;
}

function inferMediaType(url: string, contentType: string | null): string {
  if (contentType && contentType.startsWith("image/")) return contentType;
  if (/\.png($|\?)/i.test(url)) return "image/png";
  if (/\.webp($|\?)/i.test(url)) return "image/webp";
  if (/\.gif($|\?)/i.test(url)) return "image/gif";
  return "image/jpeg";
}

/** Fetches and base64-encodes product images for vision analysis, capped in count and size. */
export async function fetchAndEncodeImages(urls: string[]): Promise<EncodedImage[]> {
  const limited = urls.slice(0, MAX_IMAGES);
  const results: EncodedImage[] = [];

  for (const url of limited) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const contentLength = response.headers.get("content-length");
      if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_IMAGE_BYTES) continue;

      results.push({
        mediaType: inferMediaType(url, response.headers.get("content-type")),
        base64: buffer.toString("base64"),
      });
    } catch {
      // Skip images that fail to download rather than failing the whole analysis.
      continue;
    }
  }

  return results;
}
