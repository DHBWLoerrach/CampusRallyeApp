import { haversineDistance, bearing, formatDistance } from './geo';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(47.6164, 7.6706, 47.6164, 7.6706)).toBe(0);
  });

  it('calculates distance between DHBW Lörrach and Basel SBB (~7.5 km)', () => {
    // DHBW Lörrach ≈ 47.6164, 7.6706
    // Basel SBB   ≈ 47.5474, 7.5896
    const dist = haversineDistance(47.6164, 7.6706, 47.5474, 7.5896);
    expect(dist).toBeGreaterThan(7_000);
    expect(dist).toBeLessThan(10_000);
  });

  it('calculates short campus-scale distances (~100 m)', () => {
    // Two points ~100 m apart (roughly 0.001° latitude)
    const dist = haversineDistance(47.6164, 7.6706, 47.6174, 7.6706);
    expect(dist).toBeGreaterThan(80);
    expect(dist).toBeLessThan(150);
  });
});

describe('bearing', () => {
  it('returns ~0° for due north', () => {
    const b = bearing(47.0, 7.0, 48.0, 7.0);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(2);
  });

  it('returns ~90° for due east', () => {
    const b = bearing(47.0, 7.0, 47.0, 8.0);
    expect(b).toBeGreaterThan(88);
    expect(b).toBeLessThan(92);
  });

  it('returns ~180° for due south', () => {
    const b = bearing(48.0, 7.0, 47.0, 7.0);
    expect(b).toBeGreaterThan(178);
    expect(b).toBeLessThan(182);
  });

  it('returns ~270° for due west', () => {
    const b = bearing(47.0, 8.0, 47.0, 7.0);
    expect(b).toBeGreaterThan(268);
    expect(b).toBeLessThan(272);
  });
});

describe('formatDistance', () => {
  it('formats metres for short distances', () => {
    expect(formatDistance(42)).toBe('42 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('formats kilometres for long distances', () => {
    expect(formatDistance(1_000)).toBe('1.0 km');
    expect(formatDistance(1_500)).toBe('1.5 km');
    expect(formatDistance(12_345)).toBe('12.3 km');
  });

  it('rounds metres to whole numbers', () => {
    expect(formatDistance(42.7)).toBe('43 m');
    expect(formatDistance(0.3)).toBe('0 m');
  });

  it('formats zero distance', () => {
    expect(formatDistance(0)).toBe('0 m');
  });
});

describe('haversineDistance edge cases', () => {
  it('handles southern hemisphere / negative coordinates', () => {
    // Sydney to Melbourne (~714 km)
    const dist = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(dist).toBeGreaterThan(700_000);
    expect(dist).toBeLessThan(750_000);
  });

  it('handles cross-hemisphere distances', () => {
    // London to Cape Town (~9,600 km)
    const dist = haversineDistance(51.5074, -0.1278, -33.9249, 18.4241);
    expect(dist).toBeGreaterThan(9_000_000);
    expect(dist).toBeLessThan(10_000_000);
  });
});

describe('bearing edge cases', () => {
  it('returns consistent bearing for identical points', () => {
    // Both identical — bearing is undefined mathematically, but should not crash
    const b = bearing(47.0, 7.0, 47.0, 7.0);
    expect(typeof b).toBe('number');
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});
