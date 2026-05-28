import { ImportUxResearchIdsResponseMapper } from 'src/modules/ux-research/application/mappers/import-ux-research-ids-response.mapper';

describe('ImportUxResearchIdsResponseMapper', () => {
  it('should map import summary to response dto', () => {
    const result = ImportUxResearchIdsResponseMapper.toResponse({
      uxResearchName: 'my-research',
      totalReceived: 10,
      imported: 7,
      skipped: 3,
    });

    expect(result).toEqual({
      uxResearchName: 'my-research',
      totalReceived: 10,
      imported: 7,
      skipped: 3,
    });
  });
});
