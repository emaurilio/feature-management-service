import { ImportFeatureFlagIdsResponseMapper } from 'src/modules/feature-flag/application/mappers/import-feature-flag-ids-response.mapper';

describe('ImportFeatureFlagIdsResponseMapper', () => {
  it('should map import summary to response dto', () => {
    const result = ImportFeatureFlagIdsResponseMapper.toResponse({
      featureFlagName: 'my-flag',
      totalReceived: 10,
      imported: 7,
      skipped: 3,
    });

    expect(result).toEqual({
      featureFlagName: 'my-flag',
      totalReceived: 10,
      imported: 7,
      skipped: 3,
    });
  });
});
