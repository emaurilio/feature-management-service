import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserFeatureFlagRepository } from '../../src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlagEntity } from '../../src/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';
import { UserFeatureFlag } from '../../src/feature-flag/domain/entities/UserFeatureFlag';
import { FeatureFlagEntity } from '../../src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';

describe('UserFeatureFlagRepository (Integration)', () => {
    let repository: UserFeatureFlagRepository;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [UserFeatureFlagEntity, FeatureFlagEntity],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([UserFeatureFlagEntity]),
            ],
            providers: [UserFeatureFlagRepository],
        }).compile();

        repository = module.get<UserFeatureFlagRepository>(UserFeatureFlagRepository);
        dataSource = module.get<DataSource>(DataSource);
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    beforeEach(async () => {
        await repository.clear();
        await dataSource.getRepository(FeatureFlagEntity).clear();
        
        // Insert parent feature flags to satisfy foreign key constraints
        const featureRepo = dataSource.getRepository(FeatureFlagEntity);
        await featureRepo.save([
            { id: 'feature-1', nameVersion: 'f1', name: 'f1', percentage: 0, version: 1, type: 'percentage' },
            { id: 'feature-2', nameVersion: 'f2', name: 'f2', percentage: 0, version: 1, type: 'percentage' },
            { id: 'feat-1', nameVersion: 'f3', name: 'f3', percentage: 0, version: 1, type: 'percentage' },
            { id: 'feat-2', nameVersion: 'f4', name: 'f4', percentage: 0, version: 1, type: 'percentage' },
            { id: 'feat-specific', nameVersion: 'f5', name: 'f5', percentage: 0, version: 1, type: 'percentage' },
            { id: 'feat-delete', nameVersion: 'f6', name: 'f6', percentage: 0, version: 1, type: 'percentage' },
            { id: 'other-feat', nameVersion: 'f7', name: 'f7', percentage: 0, version: 1, type: 'percentage' }
        ] as any);
    });

    it('deve criar várias user feature flags (createMany)', async () => {
        const flags = [
            new UserFeatureFlag('feature-1', 'user-1'),
            new UserFeatureFlag('feature-2', 'user-1'),
        ];

        const results = await repository.createMany(flags);

        expect(results).toHaveLength(2);
        expect(results[0].id).toBeDefined();

        const dbEntities = await repository.find({ where: { userId: 'user-1' } });
        expect(dbEntities).toHaveLength(2);
    });

    it('deve buscar user feature flags pelo userId', async () => {
        await repository.createMany([
            new UserFeatureFlag('feat-1', 'user-search'),
            new UserFeatureFlag('feat-2', 'user-search'),
            new UserFeatureFlag('feat-1', 'other-user')
        ]);

        const results = await repository.findByUserId('user-search');

        expect(results).toBeDefined();
        expect(results).toHaveLength(2);
        expect(results?.some(r => r.featureId === 'feat-1')).toBeTruthy();
        expect(results?.some(r => r.featureId === 'feat-2')).toBeTruthy();
    });

    it('deve buscar uma user feature flag por userId e featureId', async () => {
        await repository.createMany([
            new UserFeatureFlag('feat-specific', 'user-specific')
        ]);

        const result = await repository.findByUserIdAndFeatureFlagId('user-specific', 'feat-specific');

        expect(result).toBeDefined();
        expect(result?.featureId).toBe('feat-specific');
        expect(result?.userId).toBe('user-specific');

        const notFound = await repository.findByUserIdAndFeatureFlagId('user-specific', 'other-feat');
        expect(notFound).toBeNull();
    });

    it('deve deletar user feature flags pelo featureId (soft delete)', async () => {
        await repository.createMany([
            new UserFeatureFlag('feat-delete', 'user-1'),
            new UserFeatureFlag('feat-delete', 'user-2'),
            new UserFeatureFlag('other-feat', 'user-1')
        ]);

        const deleteResult = await repository.deleteByFeatureFlagId('feat-delete');

        expect(deleteResult).toBe(true);

        const remainingNormal = await repository.find();
        expect(remainingNormal).toHaveLength(1);
        expect(remainingNormal[0].featureId).toBe('other-feat');

        const allWithDeleted = await repository.find({ withDeleted: true });
        expect(allWithDeleted).toHaveLength(3);

        const deletedItems = allWithDeleted.filter(item => item.featureId === 'feat-delete');
        expect(deletedItems).toHaveLength(2);
        deletedItems.forEach(item => {
            expect(item.deletedAt).not.toBeNull();
        });
    });
});
