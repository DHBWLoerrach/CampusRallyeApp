import { getQuestionPictureUrl } from '../questionStorage';
import { supabase } from '@/utils/Supabase';

const mockGetPublicUrl = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

const mockFrom = jest.mocked(supabase.storage.from);

describe('questionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({
      getPublicUrl: mockGetPublicUrl,
    } as unknown as ReturnType<typeof supabase.storage.from>);
  });

  it('resolves a public URL from the question pictures bucket', () => {
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.test/building.jpg' },
    });

    expect(getQuestionPictureUrl('building.jpg')).toBe(
      'https://example.test/building.jpg'
    );
    expect(mockFrom).toHaveBeenCalledWith('question-pictures');
    expect(mockGetPublicUrl).toHaveBeenCalledWith('building.jpg');
  });

  it('returns null without reading storage when the bucket path is empty', () => {
    expect(getQuestionPictureUrl(undefined)).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns null when Supabase does not provide a public URL', () => {
    mockGetPublicUrl.mockReturnValue({ data: {} });

    expect(getQuestionPictureUrl('missing.jpg')).toBeNull();
  });
});
