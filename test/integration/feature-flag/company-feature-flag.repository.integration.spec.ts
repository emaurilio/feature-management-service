import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from '../../../src/modules/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CompanyFeatureFlagEntity } from '../../../src/modules/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlag } from '../../../src/modules/feature-flag/domain/entities/CompanyFeatureFlag';
import { FeatureFlagEntity } from '../../../src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';

describe('CompanyFeatureFlagRepository (Integration)', () => {
    let repository: CompanyFeatureFlagRepository;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [CompanyFeatureFlagEntity, FeatureFlagEntity],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([CompanyFeatureFlagEntity]),
            ],
            providers: [CompanyFeatureFlagRepository],
        }).compile();

        repository = module.get<CompanyFeatureFlagRepository>(CompanyFeatureFlagRepository);
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

    it('deve criar uma nova company feature flag', async () => {
        const companyFlag = new CompanyFeatureFlag('feature-1', 'company-1');
        const result = await repository.createCompanyFeatureFlag(companyFlag);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.featureId).toBe('feature-1');
        expect(result.companyId).toBe('company-1');

        const dbEntity = await repository.findOne({ where: { companyId: 'company-1' } });
        expect(dbEntity).toBeDefined();
        expect(dbEntity?.featureId).toBe('feature-1');
    });

    it('deve criar várias company feature flags (createMany)', async () => {
        const flags = [
            new CompanyFeatureFlag('feature-1', 'company-mult-1'),
            new CompanyFeatureFlag('feature-2', 'company-mult-1'),
        ];

        const results = await repository.createMany(flags);

        expect(results).toHaveLength(2);

        const dbEntities = await repository.find({ where: { companyId: 'company-mult-1' } });
        expect(dbEntities).toHaveLength(2);
    });

    it('deve buscar company feature flags pelo companyId', async () => {
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-1', 'comp-search'));
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-2', 'comp-search'));
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-1', 'other-comp'));

        const results = await repository.findByCompanyId('comp-search');

        expect(results).toBeDefined();
        expect(results).toHaveLength(2);
        expect(results?.some(r => r.featureId === 'feat-1')).toBeTruthy();
        expect(results?.some(r => r.featureId === 'feat-2')).toBeTruthy();
    });

    it('deve buscar uma company feature flag por companyId e featureId', async () => {
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-specific', 'comp-specific'));

        const result = await repository.findByCompanyIdAndFeatureFlagId('comp-specific', 'feat-specific');

        expect(result).toBeDefined();
        expect(result?.featureId).toBe('feat-specific');
        expect(result?.companyId).toBe('comp-specific');

        const notFound = await repository.findByCompanyIdAndFeatureFlagId('comp-specific', 'other-feat');
        expect(notFound).toBeNull();
    });

    it('deve deletar company feature flags pelo featureId (soft delete)', async () => {
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-delete', 'comp-1'));
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('feat-delete', 'comp-2'));
        await repository.createCompanyFeatureFlag(new CompanyFeatureFlag('other-feat', 'comp-1'));

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
