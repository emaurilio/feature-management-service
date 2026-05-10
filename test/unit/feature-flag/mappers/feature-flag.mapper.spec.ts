import { FeatureFlag } from "src/modules/feature-flag/domain/entities/FeatureFlag";
import { FeatureFlagType } from "src/modules/feature-flag/domain/enums/feature-flag-type.enum";
import { FeatureFlagEntity } from "src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity";
import { FeatureFlagMapper } from "src/modules/feature-flag/infraestructure/persistence/mappers/feature-flag.mapper";


describe('FeatureFlagMapper', () => {
  const createEntity = (
    overrides?: Partial<FeatureFlagEntity>,
  ): FeatureFlagEntity =>
    ({
      id: 'uuid-1',
      nameVersion: 'feature-v1',
      name: 'feature',
      percentage: 50,
      version: '1.0',
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
      deletedAt: null,
      ...overrides,
    }) as FeatureFlagEntity;

  const createDomain = (): FeatureFlag =>
    new FeatureFlag(
      'feature-v1',
      'feature',
      50,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
      'uuid-1',
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-02T00:00:00Z'),
      undefined,
    );

  describe('toDomain', () => {
    it('should map entity to domain', () => {
      const entity = createEntity();

      const domain = FeatureFlagMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(FeatureFlag);
      expect(domain?.id).toBe(entity.id);
      expect(domain?.nameVersion).toBe(entity.nameVersion);
      expect(domain?.name).toBe(entity.name);
      expect(domain?.percentage).toBe(entity.percentage);
      expect(domain?.version).toBe(entity.version);
      expect(domain?.isActive).toBe(entity.isActive);
      expect(domain?.type).toBe(entity.type);
      expect(domain?.createdAt).toEqual(entity.createdAt);
      expect(domain?.updatedAt).toEqual(entity.updatedAt);
      expect(domain?.deletedAt).toEqual(entity.deletedAt);
    });

    it('should handle deletedAt when set', () => {
      const deletedAt = new Date('2025-01-03T00:00:00Z');
      const entity = createEntity({ deletedAt });

      const domain = FeatureFlagMapper.toDomain(entity);

      expect(domain?.deletedAt).toEqual(deletedAt);
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence', () => {
      const domain = createDomain();

      const persistence = FeatureFlagMapper.toPersistence(domain);

      expect(persistence).toEqual({
        id: domain.id,
        nameVersion: domain.nameVersion,
        name: domain.name,
        percentage: domain.percentage,
        version: domain.version,
        isActive: domain.isActive,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
        deletedAt: undefined,
      });
    });

    it('should convert null deletedAt to undefined', () => {
      const domain = createDomain();
      (domain as { deletedAt?: Date }).deletedAt = undefined;

      const persistence = FeatureFlagMapper.toPersistence(domain);

      expect(persistence.deletedAt).toBeUndefined();
    });
  });
});
