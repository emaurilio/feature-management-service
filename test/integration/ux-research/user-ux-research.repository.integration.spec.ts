import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserUXResearchRepository } from '../../../src/modules/ux-research/infraestructure/persistence/repositories/user-ux-research.repository';
import { UserUXResearchEntity } from '../../../src/modules/ux-research/infraestructure/persistence/entities/user-ux-resarch.entity';
import { UXResearchEntity } from '../../../src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { FeatureFlagEntity } from '../../../src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { UserUXResearch } from '../../../src/modules/ux-research/domain/entites/UserUXResearch';

describe('UserUXResearchRepository (Integration)', () => {
    let repository: UserUXResearchRepository;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [
                        UserUXResearchEntity,
                        UXResearchEntity,
                        FeatureFlagEntity,
                    ],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([UserUXResearchEntity]),
            ],
            providers: [UserUXResearchRepository],
        }).compile();

        repository = module.get<UserUXResearchRepository>(
            UserUXResearchRepository,
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

    it('deve persistir vários vínculos user–ux research (createMany)', async () => {
        const rows = [
            new UserUXResearch('ux-research-1', 'user-mult-1'),
            new UserUXResearch('ux-research-2', 'user-mult-1'),
        ];

        const results = await repository.createMany(rows);

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.id)).toBeTruthy();

        const dbEntities = await repository.find({
            where: { userId: 'user-mult-1' },
        });
        expect(dbEntities).toHaveLength(2);
        const uxIds = dbEntities.map((e) => e.uxResearchId).sort();
        expect(uxIds).toEqual(['ux-research-1', 'ux-research-2']);
    });

    it('deve retornar array vazio em findByUserId quando não há vínculos', async () => {
        const result = await repository.findByUserId('user-inexistente');
        expect(result).toEqual([]);
    });

    it('deve buscar vínculos por userId', async () => {
        await repository.createMany([
            new UserUXResearch('ux-research-1', 'user-search'),
            new UserUXResearch('ux-research-2', 'user-search'),
            new UserUXResearch('ux-research-1', 'outro-user'),
        ]);

        const results = await repository.findByUserId('user-search');

        expect(results).toBeDefined();
        expect(results).toHaveLength(2);
        expect(
            results?.some(
                (r) =>
                    r.uxResearchId === 'ux-research-1' &&
                    r.userId === 'user-search',
            ),
        ).toBe(true);
        expect(
            results?.some(
                (r) =>
                    r.uxResearchId === 'ux-research-2' &&
                    r.userId === 'user-search',
            ),
        ).toBe(true);
    });

    it('deve buscar um vínculo por userId e uxResearchId', async () => {
        await repository.createMany([
            new UserUXResearch('ux-research-other', 'user-specific'),
        ]);

        const found = await repository.findByUserIdAndUXResearchId(
            'user-specific',
            'ux-research-other',
        );

        expect(found).toBeDefined();
        expect(found?.uxResearchId).toBe('ux-research-other');
        expect(found?.userId).toBe('user-specific');

        const notFound = await repository.findByUserIdAndUXResearchId(
            'user-specific',
            'ux-research-1',
        );
        expect(notFound).toBeNull();
    });

    it('deve aplicar soft delete por uxResearchId e retornar true', async () => {
        await repository.createMany([
            new UserUXResearch('ux-research-delete', 'user-a'),
            new UserUXResearch('ux-research-delete', 'user-b'),
            new UserUXResearch('ux-research-other', 'user-a'),
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

    it('deve retornar true em deleteByUXResearchId quando não há linhas', async () => {
        const result = await repository.deleteByUXResearchId(
            'ux-research-inexistente',
        );
        expect(result).toBe(true);
    });
});
