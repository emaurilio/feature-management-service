import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyUXResearchRepository } from '../../../src/modules/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';
import { CompanyUXResearchEntity } from '../../../src/modules/ux-research/infraestructure/persistence/entities/company-ux-research.entity';
import { UXResearchEntity } from '../../../src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { FeatureFlagEntity } from '../../../src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { CompanyUXResearch } from '../../../src/modules/ux-research/domain/entites/CompanyUXResearch';

describe('CompanyUXResearchRepository (Integration)', () => {
    let repository: CompanyUXResearchRepository;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [
                        CompanyUXResearchEntity,
                        UXResearchEntity,
                        FeatureFlagEntity,
                    ],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([CompanyUXResearchEntity]),
            ],
            providers: [CompanyUXResearchRepository],
        }).compile();

        repository = module.get<CompanyUXResearchRepository>(
            CompanyUXResearchRepository,
        );
        dataSource = module.get<DataSource>(DataSource);
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
    });

    beforeEach(async () => {
        await repository.clear();
        await dataSource.getRepository(UXResearchEntity).clear();
        await dataSource.getRepository(FeatureFlagEntity).clear();

        const uxRepo = dataSource.getRepository(UXResearchEntity);
        await uxRepo.save([
            {
                id: 'ux-research-1',
                nameVersion: 'ux-nv-1',
                name: 'ux-name-1',
                version: 1,
                isActive: true,
            },
            {
                id: 'ux-research-2',
                nameVersion: 'ux-nv-2',
                name: 'ux-name-2',
                version: 1,
                isActive: true,
            },
            {
                id: 'ux-research-delete',
                nameVersion: 'ux-nv-del',
                name: 'ux-name-del',
                version: 1,
                isActive: true,
            },
            {
                id: 'ux-research-other',
                nameVersion: 'ux-nv-other',
                name: 'ux-name-other',
                version: 1,
                isActive: true,
            },
        ] as Partial<UXResearchEntity>[]);
    });

    it('should persist multiple company–ux research links (createMany)', async () => {
        const rows = [
            new CompanyUXResearch('ux-research-1', 'company-mult-1'),
            new CompanyUXResearch('ux-research-2', 'company-mult-1'),
        ];

        const results = await repository.createMany(rows);

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.id)).toBeTruthy();

        const dbEntities = await repository.find({
            where: { companyId: 'company-mult-1' },
        });
        expect(dbEntities).toHaveLength(2);
        const uxIds = dbEntities.map((e) => e.uxResearchId).sort();
        expect(uxIds).toEqual(['ux-research-1', 'ux-research-2']);
    });

    it('should return null when there are no links', async () => {
        const result = await repository.findByCompanyId('company-inexistente');
        expect(result).toBeNull();
    });

    it('should find links by companyId', async () => {
        await repository.createMany([
            new CompanyUXResearch('ux-research-1', 'company-search'),
            new CompanyUXResearch('ux-research-2', 'company-search'),
            new CompanyUXResearch('ux-research-1', 'outra-company'),
        ]);

        const results = await repository.findByCompanyId('company-search');

        expect(results).toBeDefined();
        expect(results).toHaveLength(2);
        expect(
            results?.some(
                (r) =>
                    r.uxResearchId === 'ux-research-1' &&
                    r.companyId === 'company-search',
            ),
        ).toBe(true);
        expect(
            results?.some(
                (r) =>
                    r.uxResearchId === 'ux-research-2' &&
                    r.companyId === 'company-search',
            ),
        ).toBe(true);
    });

    it('should find a link by companyId and uxResearchId', async () => {
        await repository.createMany([
            new CompanyUXResearch('ux-research-other', 'company-specific'),
        ]);

        const found = await repository.findByCompanyIdAndUXResearchId(
            'company-specific',
            'ux-research-other',
        );

        expect(found).toBeDefined();
        expect(found?.uxResearchId).toBe('ux-research-other');
        expect(found?.companyId).toBe('company-specific');

        const notFound = await repository.findByCompanyIdAndUXResearchId(
            'company-specific',
            'ux-research-1',
        );
        expect(notFound).toBeNull();
    });

    it('should apply soft delete by uxResearchId and return true', async () => {
        await repository.createMany([
            new CompanyUXResearch('ux-research-delete', 'comp-a'),
            new CompanyUXResearch('ux-research-delete', 'comp-b'),
            new CompanyUXResearch('ux-research-other', 'comp-a'),
        ]);

        const deleteResult =
            await repository.deleteByUXResearchId('ux-research-delete');

        expect(deleteResult).toBe(true);

        const remaining = await repository.find();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].uxResearchId).toBe('ux-research-other');

        const withDeleted = await repository.find({ withDeleted: true });
        expect(withDeleted).toHaveLength(3);
        const deletedRows = withDeleted.filter(
            (r) => r.uxResearchId === 'ux-research-delete',
        );
        expect(deletedRows).toHaveLength(2);
        deletedRows.forEach((row) => {
            expect(row.deletedAt).not.toBeNull();
        });
    });

    it('should return true when there are no links', async () => {
        const result = await repository.deleteByUXResearchId(
            'ux-research-inexistente',
        );
        expect(result).toBe(true);
    });
});
