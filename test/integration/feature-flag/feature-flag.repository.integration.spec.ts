import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FeatureFlagRepository } from '../../../src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from '../../../src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { FeatureFlag } from '../../../src/modules/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from '../../../src/modules/feature-flag/domain/enums/feature-flag-type.enum';

describe('FeatureFlagRepository (Integration)', () => {
  let repository: FeatureFlagRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [FeatureFlagEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([FeatureFlagEntity]),
      ],
      providers: [FeatureFlagRepository],
    }).compile();

    repository = module.get<FeatureFlagRepository>(FeatureFlagRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await repository.clear();
  });

  it('should create a new feature flag in the database', async () => {
    const featureFlag = new FeatureFlag(
      'minha-feature-flag-1',
      'minha-feature-flag',
      50,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
    );

    const result = await repository.createFeatureFlag(featureFlag);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('minha-feature-flag');

    const savedEntity = await repository.findOne({ where: { name: 'minha-feature-flag' } });
    expect(savedEntity).toBeDefined();
    expect(savedEntity?.name).toBe('minha-feature-flag');
  });

  it('should find a feature flag by name', async () => {
    const featureFlag = new FeatureFlag(
      'outra-feature-flag-1',
      'outra-feature-flag',
      100,
      1,
      true,
      FeatureFlagType.COMPANY,
    );
    await repository.createFeatureFlag(featureFlag);

    const result = await repository.findByName('outra-feature-flag');

    expect(result).toBeDefined();
    expect(result?.name).toBe('outra-feature-flag');
  });

  it('should find paginated and by name (like)', async () => {
    const flag1 = new FeatureFlag('id-1', 'search-flag-1', 10, 1, true, FeatureFlagType.PERCENTAGE);
    const flag2 = new FeatureFlag('id-2', 'search-flag-2', 20, 1, true, FeatureFlagType.PERCENTAGE);
    const flag3 = new FeatureFlag('id-3', 'other-flag', 30, 1, true, FeatureFlagType.PERCENTAGE);

    await repository.createFeatureFlag(flag1);
    await repository.createFeatureFlag(flag2);
    await repository.createFeatureFlag(flag3);

    const resultPage1 = await repository.searchByNamePaginated('search', 1, 1);
    const resultPage2 = await repository.searchByNamePaginated('search', 2, 1);

    expect(resultPage1.total).toBe(2);
    expect(resultPage1.data).toHaveLength(1);
    expect(resultPage1.data[0].name).toBe('search-flag-1');

    expect(resultPage2.total).toBe(2);
    expect(resultPage2.data).toHaveLength(1);
    expect(resultPage2.data[0].name).toBe('search-flag-2');
  });

  it('should update a feature flag partially', async () => {
    const flag = new FeatureFlag('id-update', 'update-flag', 100, 1, true, FeatureFlagType.PERCENTAGE);
    const created = await repository.createFeatureFlag(flag);

    const result = await repository.updateFeatureFlag(created.id ?? '', { isActive: false });

    expect(result.isActive).toBe(false);
    expect(result.name).toBe('update-flag');

    const dbEntity = await repository.findOne({ where: { id: created.id } });
    expect(dbEntity?.isActive).toBe(false);
  });

  it('should do the soft delete of a feature flag', async () => {
    const flag = new FeatureFlag('id-delete', 'delete-flag', 100, 1, true, FeatureFlagType.PERCENTAGE);
    const created = await repository.createFeatureFlag(flag);

    const deletedResult = await repository.deleteFeatureFlag(created.id ?? '');

    expect(deletedResult).toBe(true);

    const normalFind = await repository.findOne({ where: { id: created.id } });
    expect(normalFind).toBeNull();

    const findWithDeleted = await repository.findOne({ where: { id: created.id }, withDeleted: true });
    expect(findWithDeleted).toBeDefined();
    expect(findWithDeleted?.deletedAt).not.toBeNull();
  });
});
