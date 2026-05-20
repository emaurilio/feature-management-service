import { CheckUxResearchResponseMapper } from 'src/modules/ux-research/application/mappers/check-ux-research-response.mapper';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('CheckUxResearchResponseMapper', () => {
  it('should map ux research and check result to response dto', () => {
    const startDate = new Date('2024-01-01T00:00:00.000Z');
    const endDate = new Date('2024-12-31T00:00:00.000Z');
    const uxResearch = new UXResearch(
      'research-1',
      'research',
      75,
      2,
      true,
      UXResearchType.PERCENTAGE,
      'linked-flag',
      startDate,
      endDate,
      'ux-id',
    );

    const result = CheckUxResearchResponseMapper.toResponse(uxResearch, false);

    expect(result).toEqual({
      id: 'ux-id',
      name: 'research',
      nameVersion: 'research-1',
      type: UXResearchType.PERCENTAGE,
      percentage: 75,
      version: 2,
      isActive: true,
      featureFlagName: 'linked-flag',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      checkUxResearch: false,
    });
  });
});
