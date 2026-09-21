import { preparePhotoUpload } from '../preparePhotoUpload';

const mockManipulate = jest.fn();
const mockFile = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: (...args: unknown[]) => mockManipulate(...args),
  },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system', () => ({
  File: function (...args: unknown[]) {
    return mockFile(...args);
  },
}));

describe('preparePhotoUpload', () => {
  const bytes = new Uint8Array([255, 216, 255, 217]);
  const source = { width: 4032, height: 3024 };
  const mockSave = jest.fn();
  const mockReadBytes = jest.fn();
  const mockDelete = jest.fn();
  const mockReleaseImage = jest.fn();
  const mockReleaseContext = jest.fn();
  let dimensions: { width: number; height: number };
  let savedImages: { width: number; height: number }[];

  beforeEach(() => {
    jest.resetAllMocks();
    source.width = 4032;
    source.height = 3024;
    savedImages = [];
    mockReadBytes.mockResolvedValue(bytes);
    mockFile.mockReturnValue({
      size: 500_000,
      bytes: mockReadBytes,
      delete: mockDelete,
    });
    mockSave.mockImplementation(async () => {
      savedImages.push({ ...dimensions });
      return {
        ...dimensions,
        uri: `file://processed-${savedImages.length}.jpg`,
      };
    });
    mockManipulate.mockImplementation(() => {
      dimensions = { ...source };
      return {
        reset: () => {
          dimensions = { ...source };
        },
        resize: (size: { width?: number; height?: number }) => {
          const scale = size.width
            ? size.width / dimensions.width
            : size.height! / dimensions.height;
          dimensions = {
            width: Math.round(dimensions.width * scale),
            height: Math.round(dimensions.height * scale),
          };
        },
        renderAsync: async () => ({
          ...dimensions,
          saveAsync: mockSave,
          release: mockReleaseImage,
        }),
        release: mockReleaseContext,
      };
    });
  });

  it.each([
    [4032, 3024, 2048, 1536],
    [3024, 4032, 1536, 2048],
    [3000, 3000, 2048, 2048],
    [1200, 800, 1200, 800],
  ])(
    'prepares %ix%i as %ix%i without cropping or upscaling',
    async (width, height, expectedWidth, expectedHeight) => {
      Object.assign(source, { width, height });

      await expect(preparePhotoUpload('file://original.jpg')).resolves.toEqual(
        bytes
      );

      expect(savedImages).toEqual([
        { width: expectedWidth, height: expectedHeight },
      ]);
      expect(mockSave).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.85 });
      expect(mockFile).toHaveBeenCalledWith('file://processed-1.jpg');
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockReleaseContext).toHaveBeenCalledTimes(1);
    }
  );

  it('reduces an oversized result further before reading upload bytes', async () => {
    mockFile.mockReturnValueOnce({ size: 10_000_001, delete: mockDelete });

    await preparePhotoUpload('file://original.jpg');

    expect(savedImages).toEqual([
      { width: 2048, height: 1536 },
      { width: 1536, height: 1152 },
    ]);
    expect(mockSave).toHaveBeenLastCalledWith({
      format: 'jpeg',
      compress: 0.75,
    });
    expect(mockReadBytes).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('accepts a file exactly at the byte limit', async () => {
    const limitBytes = new Uint8Array(10_000_000);
    mockReadBytes.mockResolvedValue(limitBytes);
    mockFile.mockReturnValue({
      size: 10_000_000,
      bytes: mockReadBytes,
      delete: mockDelete,
    });

    await expect(preparePhotoUpload('file://original.jpg')).resolves.toBe(
      limitBytes
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('also checks the actual byte count before accepting an image', async () => {
    mockReadBytes.mockResolvedValueOnce(new Uint8Array(10_000_001));

    await expect(preparePhotoUpload('file://original.jpg')).resolves.toEqual(
      bytes
    );
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('rejects empty image bytes', async () => {
    mockReadBytes.mockResolvedValue(new Uint8Array());

    await expect(preparePhotoUpload('file://original.jpg')).rejects.toThrow(
      'empty'
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('stops after bounded attempts when every result exceeds the limit', async () => {
    mockFile.mockReturnValue({ size: 10_000_001, delete: mockDelete });

    await expect(preparePhotoUpload('file://original.jpg')).rejects.toThrow(
      '10 MB'
    );

    expect(savedImages).toEqual([
      { width: 2048, height: 1536 },
      { width: 1536, height: 1152 },
      { width: 1024, height: 768 },
    ]);
    expect(mockReadBytes).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockReleaseContext).toHaveBeenCalledTimes(1);
  });

  it.each([0, NaN])(
    'rejects an unreadable result with size %s',
    async (size) => {
      mockFile.mockReturnValue({ size, delete: mockDelete });

      await expect(preparePhotoUpload('file://original.jpg')).rejects.toThrow();
      expect(mockReadBytes).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(1);
    }
  );

  it('cleans up the processed file if reading its bytes fails', async () => {
    mockReadBytes.mockRejectedValue(new Error('Cannot read image'));

    await expect(preparePhotoUpload('file://original.jpg')).rejects.toThrow(
      'Cannot read image'
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockReleaseContext).toHaveBeenCalledTimes(1);
  });

  it('releases native images and the context if encoding fails', async () => {
    mockSave.mockRejectedValue(new Error('Encoding failed'));

    await expect(preparePhotoUpload('file://original.jpg')).rejects.toThrow(
      'Encoding failed'
    );
    expect(mockReleaseImage).toHaveBeenCalledTimes(2);
    expect(mockReleaseContext).toHaveBeenCalledTimes(1);
    expect(mockFile).not.toHaveBeenCalled();
  });
});
