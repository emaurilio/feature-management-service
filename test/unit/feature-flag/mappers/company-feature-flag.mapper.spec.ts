import { CompanyFeatureFlag } from 'src/modules/feature-flag/domain/entities/CompanyFeatureFlag';
import { CompanyFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlagMapper } from 'src/modules/feature-flag/infraestructure/persistence/mappers/company-feature-flag.mapper';

describe('CompanyFeatureFlagMapper', () => {
  const createEntity = (
    overrides?: Partial<CompanyFeatureFlagEntity>,
  ): CompanyFeatureFlagEntity =>
    ({
      id: 'uuid-1',
      featureId: 'flag-123',
      companyId: 'company-456',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
      deletedAt: null,
      ...overrides,
    }) as CompanyFeatureFlagEntity;

  const createDomain = (): CompanyFeatureFlag =>
    new CompanyFeatureFlag(
      'flag-123',
      'company-456',
      'uuid-1',
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-02T00:00:00Z'),
      undefined,
    );

  describe('toDomain', () => {
    it('should map entity to domain', () => {
      const entity = createEntity();

      const domain = CompanyFeatureFlagMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(CompanyFeatureFlag);
      expect(domain.id).toBe(entity.id);
      expect(domain.featureId).toBe(entity.featureId);
      expect(domain.companyId).toBe(entity.companyId);
    });

    it('should handle all fields correctly', () => {
      const entity = createEntity({
        featureId: 'other-flag',
        companyId: 'other-company',
      });

      const domain = CompanyFeatureFlagMapper.toDomain(entity);

      expect(domain.featureId).toBe('other-flag');
      expect(domain.companyId).toBe('other-company');
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence', () => {
      const domain = createDomain();

      const persistence = CompanyFeatureFlagMapper.toPersistence(domain);

      expect(persistence).toEqual({
        id: domain.id,
        featureId: domain.featureId,
        companyId: domain.companyId,
      });
    });

    it('should not include timestamps in persistence output', () => {
      const domain = createDomain();
      const persistence = CompanyFeatureFlagMapper.toPersistence(domain);

      expect(persistence).not.toHaveProperty('createdAt');
      expect(persistence).not.toHaveProperty('updatedAt');
      expect(persistence).not.toHaveProperty('deletedAt');
    });
  });
});
