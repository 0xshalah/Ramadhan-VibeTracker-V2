import { describe, it, expect } from 'vitest';

// Simulasi logika kalkulasi XP yang merupakan jantung dari sistem progres
const calculateXP = (tilawah: number, sholat: number, sunnahCount: number) => {
  return (tilawah * 10) + (sholat * 5) + (sunnahCount * 15);
};

describe('Logic: XP Calculation', () => {
  it('should calculate total XP correctly based on activities', () => {
    const total = calculateXP(5, 5, 2); // 5 hal, 5 sholat, 2 sunnah
    // (5*10) + (5*5) + (2*15) = 50 + 25 + 30 = 105
    expect(total).toBe(105);
  });

  it('should return 0 if no activities are done', () => {
    expect(calculateXP(0, 0, 0)).toBe(0);
  });

  it('should handle large values correctly', () => {
    const total = calculateXP(100, 50, 20);
    // (100*10) + (50*5) + (20*15) = 1000 + 250 + 300 = 1550
    expect(total).toBe(1550);
  });
});
