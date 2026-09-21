import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Use decimal MB so the result also fits a bucket configured with a 10 MiB limit.
const MAX_PHOTO_BYTES = 10_000_000;
const PHOTO_ENCODINGS = [
  { maxDimension: 2048, quality: 0.85 },
  { maxDimension: 1536, quality: 0.75 },
  { maxDimension: 1024, quality: 0.65 },
];

export async function preparePhotoUpload(
  imageUri: string
): Promise<Uint8Array<ArrayBuffer>> {
  const context = ImageManipulator.manipulate(imageUri);

  try {
    const original = await context.renderAsync();
    const { width, height } = original;
    original.release();

    if (
      ![width, height].every((value) => Number.isFinite(value) && value > 0)
    ) {
      throw new Error('Cannot determine photo dimensions');
    }

    for (const { maxDimension, quality } of PHOTO_ENCODINGS) {
      // Always resize the original to avoid repeated JPEG compression and upscaling.
      context.reset();
      if (Math.max(width, height) > maxDimension) {
        context.resize(
          width >= height ? { width: maxDimension } : { height: maxDimension }
        );
      }

      const image = await context.renderAsync();
      let file: File | undefined;
      try {
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: quality,
        });
        file = new File(result.uri);
        const size = file.size;
        if (!Number.isFinite(size) || size <= 0) {
          throw new Error('Cannot read prepared photo');
        }
        if (size > MAX_PHOTO_BYTES) continue;

        const bytes = await file.bytes();
        if (bytes.byteLength === 0) {
          throw new Error('Prepared photo is empty');
        }
        if (bytes.byteLength <= MAX_PHOTO_BYTES) return bytes;
      } finally {
        image.release();
        // The original remains available for the preview and upload retries.
        if (file) {
          try {
            file.delete();
          } catch (error) {
            console.warn('Could not remove prepared photo from cache:', error);
          }
        }
      }
    }

    throw new Error('Photo still exceeds 10 MB after compression');
  } finally {
    context.release();
  }
}
