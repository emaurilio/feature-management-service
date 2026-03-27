import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { UserFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';
import { UserFeatureFlagMapper } from 'src/feature-flag/infraestructure/persistence/mappers/user-feature-flag.mapper';

describe('UserFeatureFlagMapper', () => {
  const createEntity = (
    overrides?: Partial<UserFeatureFlagEntity>,
  ): UserFeatureFlagEntity =>
    ({
      id: 'uuid-1',
      featureId: 'flag-123',
      companyId: 'company-456',
      userId: 'user-789',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
      deletedAt: null,
      ...overrides,
    }) as UserFeatureFlagEntity;

  const createDomain = (
    overrides?: Partial<UserFeatureFlag>,
  ): UserFeatureFlag =>
    new UserFeatureFlag(
      'flag-123',
      'user-789',
      'uuid-1',
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-02T00:00:00Z'),
      undefined,
    );

  describe('toDomain', () => {
    it('should map entity to domain', () => {
      const entity = createEntity();

      const domain = UserFeatureFlagMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(UserFeatureFlag);
      expect(domain.id).toBe(entity.id);
      expect(domain.featureId).toBe(entity.featureId);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
      expect(domain.deletedAt).toEqual(entity.deletedAt);
    });

    it('should handle all fields correctly', () => {
      const entity = createEntity({
        featureId: 'other-flag',
        companyId: 'other-company',
        userId: 'other-user',
      });

      const domain = UserFeatureFlagMapper.toDomain(entity);

      expect(domain.featureId).toBe('other-flag');
      expect(domain.userId).toBe('other-user');
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence', () => {
      const domain = createDomain();

      const persistence = UserFeatureFlagMapper.toPersistence(domain);

      expect(persistence).toEqual({
        id: domain.id,
        featureId: domain.featureId,
        userId: domain.userId,
      });
    });

    it('should not include createdAt, updatedAt, deletedAt in persistence output', () => {
      const domain = createDomain();
      const persistence = UserFeatureFlagMapper.toPersistence(domain);

      expect(persistence).not.toHaveProperty('createdAt');
      expect(persistence).not.toHaveProperty('updatedAt');
      expect(persistence).not.toHaveProperty('deletedAt');
    });
  });
});
