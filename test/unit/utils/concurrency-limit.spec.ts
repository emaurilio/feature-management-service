import { mapWithConcurrencyLimit } from 'src/modules/common/utils/concurrency-limit.util';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('concurrency-limit.util', () => {
  describe('mapWithConcurrencyLimit', () => {
    it('should return empty array when items is empty', async () => {
      const mapper = jest.fn();
      const result = await mapWithConcurrencyLimit([], 5, mapper);

      expect(result).toEqual([]);
      expect(mapper).not.toHaveBeenCalled();
    });

    it('should throw when concurrency is less than 1', async () => {
      await expect(
        mapWithConcurrencyLimit(['a'], 0, async (item) => item),
      ).rejects.toThrow('concurrency must be at least 1');

      await expect(
        mapWithConcurrencyLimit(['a'], -1, async (item) => item),
      ).rejects.toThrow('concurrency must be at least 1');
    });

    it('should map a single item', async () => {
      const result = await mapWithConcurrencyLimit(
        ['company-1'],
        50,
        async (item, index) => `${item}:${index}`,
      );

      expect(result).toEqual(['company-1:0']);
    });

    it('should preserve result order regardless of completion time', async () => {
      const items = [0, 1, 2, 3, 4];
      const result = await mapWithConcurrencyLimit(items, 5, async (item) => {
        await delay(item === 0 ? 30 : 5);
        return item * 2;
      });

      expect(result).toEqual([0, 2, 4, 6, 8]);
    });

    it('should pass correct index to mapper', async () => {
      const indices: number[] = [];

      await mapWithConcurrencyLimit(['a', 'b', 'c'], 2, async (_item, index) => {
        indices.push(index);
      });

      expect(indices.sort((a, b) => a - b)).toEqual([0, 1, 2]);
    });

    it('should not exceed concurrency limit', async () => {
      const concurrency = 2;
      const items = Array.from({ length: 8 }, (_, i) => i);
      let active = 0;
      let maxActive = 0;

      await mapWithConcurrencyLimit(items, concurrency, async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await delay(20);
        active--;
      });

      expect(maxActive).toBeLessThanOrEqual(concurrency);
      expect(maxActive).toBeGreaterThan(1);
    });

    it('should use at most items.length workers when concurrency exceeds items', async () => {
      const result = await mapWithConcurrencyLimit(
        [1, 2],
        100,
        async (item) => item * 10,
      );

      expect(result).toEqual([10, 20]);
    });

    it('should process all items with concurrency of 1', async () => {
      const result = await mapWithConcurrencyLimit(
        [1, 2, 3],
        1,
        async (item) => item + 1,
      );

      expect(result).toEqual([2, 3, 4]);
    });

    it('should propagate mapper rejection', async () => {
      await expect(
        mapWithConcurrencyLimit([1, 2, 3], 2, async (item) => {
          if (item === 2) {
            throw new Error('mapper failed');
          }
          return item;
        }),
      ).rejects.toThrow('mapper failed');
    });
  });
});
