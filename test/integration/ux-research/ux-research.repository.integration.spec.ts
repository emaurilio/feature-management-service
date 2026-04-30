import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from '../../../src/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from '../../../src/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { FeatureFlagEntity } from '../../../src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { UXResearch } from '../../../src/ux-research/domain/entites/UXResearch';
import { UXResearchType } from '../../../src/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository (Integration)', () => {
    let repository: UXResearchRepository;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [UXResearchEntity, FeatureFlagEntity],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([UXResearchEntity]),
            ],
            providers: [UXResearchRepository],
        }).compile();

        repository = module.get<UXResearchRepository>(UXResearchRepository);
        dataSource = module.get<DataSource>(DataSource);
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
    });

    beforeEach(async () => {
        await repository.clear();
        await dataSource.getRepository(FeatureFlagEntity).clear();
    });

    it('deve persistir e retornar domínio (createUXResearch)', async () => {
        const domain = new UXResearch(
            'nv-create-1',
            'ux-name-create',
            10,
            1,
            true,
            UXResearchType.PERCENTAGE,
        );

        const result = await repository.createUXResearch(domain);

        expect(result).toBeInstanceOf(UXResearch);
        expect(result.id).toBeDefined();
        expect(result.name).toBe('ux-name-create');
        expect(result.nameVersion).toBe('nv-create-1');
        expect(result.percentage).toBe(10);
        expect(result.type).toBe(UXResearchType.PERCENTAGE);

        const row = await repository.findOne({ where: { name: 'ux-name-create' } });
        expect(row).toBeDefined();
        expect(row?.nameVersion).toBe('nv-create-1');
    });

    it('deve buscar por nome (findByName)', async () => {
        await repository.createUXResearch(
            new UXResearch(
                'nv-find',
                'ux-find-by-name',
                0,
                1,
                true,
                UXResearchType.COMPANY,
            ),
        );

        const found = await repository.findByName('ux-find-by-name');
        expect(found).not.toBeNull();
        expect(found?.name).toBe('ux-find-by-name');
        expect(found?.type).toBe(UXResearchType.COMPANY);

        const missing = await repository.findByName('inexistente');
        expect(missing).toBeNull();
    });

    it('findByName com withDeleted deve incluir registro soft-deleted', async () => {
        const created = await repository.createUXResearch(
            new UXResearch(
                'nv-del-name',
                'ux-soft-name',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );

        await repository.deleteUXResearch(created.id!);

        expect(await repository.findByName('ux-soft-name')).toBeNull();

        const withDeleted = await repository.findByName('ux-soft-name', true);
        expect(withDeleted).not.toBeNull();
        expect(withDeleted?.deletedAt).toBeDefined();
    });

    it('deve buscar por featureFlagName (getByFeatureFlagName)', async () => {
        await repository.createUXResearch(
            new UXResearch(
                'nv-ff',
                'ux-com-flag',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
                'minha-feature-ux',
            ),
        );

        const byFlag = await repository.getByFeatureFlagName('minha-feature-ux');
        expect(byFlag).not.toBeNull();
        expect(byFlag?.name).toBe('ux-com-flag');
        expect(byFlag?.featureFlagName).toBe('minha-feature-ux');

        expect(await repository.getByFeatureFlagName('outra-flag')).toBeNull();
    });

    it('searchByNamePaginated deve usar LIKE e paginar', async () => {
        await repository.createUXResearch(
            new UXResearch(
                'nv-s1',
                'prefixo-busca-alpha',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );
        await repository.createUXResearch(
            new UXResearch(
                'nv-s2',
                'prefixo-busca-beta',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );
        await repository.createUXResearch(
            new UXResearch(
                'nv-s3',
                'outro-nome',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );

        const page1 = await repository.searchByNamePaginated('prefixo-busca', 1, 1);
        expect(page1.total).toBe(2);
        expect(page1.data).toHaveLength(1);
        expect(page1.data[0].name).toMatch(/prefixo-busca-/);

        const page2 = await repository.searchByNamePaginated('prefixo-busca', 2, 1);
        expect(page2.data).toHaveLength(1);
        expect(page2.total).toBe(2);
    });

    it('updateUXResearch deve aplicar alterações e retornar domínio', async () => {
        const created = await repository.createUXResearch(
            new UXResearch(
                'nv-upd',
                'ux-update-target',
                5,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );

        const updated = await repository.updateUXResearch(created.id!, {
            percentage: 42,
            isActive: false,
        } as Partial<UXResearch>);

        expect(updated.percentage).toBe(42);
        expect(updated.isActive).toBe(false);
        expect(updated.name).toBe('ux-update-target');
    });

    it('deleteUXResearch deve soft delete e retornar true', async () => {
        const created = await repository.createUXResearch(
            new UXResearch(
                'nv-del',
                'ux-delete-target',
                0,
                1,
                true,
                UXResearchType.PERCENTAGE,
            ),
        );

        const ok = await repository.deleteUXResearch(created.id!);
        expect(ok).toBe(true);

        expect(await repository.findOne({ where: { id: created.id } })).toBeNull();
    });

    it('deleteUXResearch deve retornar false para id inexistente', async () => {
        const ok = await repository.deleteUXResearch(
            '00000000-0000-0000-0000-000000000000',
        );
        expect(ok).toBe(false);
    });
});
