import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UXResearchResponseRepository } from '../../../src/modules/ux-research/infraestructure/persistence/repositories/ux-research-response.repository';
import { UXResearchResponseEntity } from '../../../src/modules/ux-research/infraestructure/persistence/entities/ux-research-response.entity';
import { UXResearchResponse } from '../../../src/modules/ux-research/domain/entites/UXResearchResponse';

describe('UXResearchResponseRepository (Integration)', () => {
    let repository: UXResearchResponseRepository;
    let dataSource: DataSource;

    const uxResearchId = 'ux-resp-paginate';
    const responseDate = new Date('2026-04-30T12:00:00.000Z');

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [UXResearchResponseEntity],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([UXResearchResponseEntity]),
            ],
            providers: [UXResearchResponseRepository],
        }).compile();

        repository = module.get<UXResearchResponseRepository>(
            UXResearchResponseRepository,
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
    });

    it('should persist response (createUXResearchResponse)', async () => {
        const domain = new UXResearchResponse(
            { score: 9, note: 'ok' },
            responseDate,
            'ux-research-create',
            'user-1',
            'company-1',
        );

        const saved = await repository.createUXResearchResponse(domain);

        expect(saved.id).toBeDefined();
        expect(saved.uxResearchId).toBe('ux-research-create');
        expect(saved.userId).toBe('user-1');
        expect(saved.companyId).toBe('company-1');
        expect(saved.response).toEqual({ score: 9, note: 'ok' });

        const row = await repository.findOne({ where: { id: saved.id } });
        expect(row).toBeDefined();
        expect(row?.response).toEqual({ score: 9, note: 'ok' });
    });

    it('searchByUXResearchIdPaginated should return empty meta and items when there are no data', async () => {
        const result = await repository.searchByUXResearchIdPaginated(
            'sem-dados',
            1,
            10,
        );

        expect(result).not.toBeNull();
        expect(result?.items).toEqual([]);
        expect(result?.meta.totalItems).toBe(0);
        expect(result?.meta.itemCount).toBe(0);
        expect(result?.meta.currentPage).toBe(1);
        expect(result?.meta.itemsPerPage).toBe(10);
        expect(result?.meta.totalPages).toBe(0);
    });

    it('searchByUXResearchIdPaginated should paginate results', async () => {
        for (let i = 0; i < 5; i++) {
            await repository.createUXResearchResponse(
                new UXResearchResponse(
                    { index: i },
                    responseDate,
                    uxResearchId,
                    `user-${i}`,
                ),
            );
        }

        const page1 = await repository.searchByUXResearchIdPaginated(
            uxResearchId,
            1,
            2,
        );
        expect(page1?.items).toHaveLength(2);
        expect(page1?.meta.totalItems).toBe(5);
        expect(page1?.meta.totalPages).toBe(3);
        expect(page1?.meta.currentPage).toBe(1);
        expect(page1?.meta.itemsPerPage).toBe(2);

        const page3 = await repository.searchByUXResearchIdPaginated(
            uxResearchId,
            3,
            2,
        );
        expect(page3?.items).toHaveLength(1);
        expect(page3?.meta.currentPage).toBe(3);
    });

    it('getByUXResearchIdPaginated should return null when there are no responses', async () => {
        const result = await repository.getByUXResearchIdPaginated(
            'nada-aqui',
            1,
            10,
        );
        expect(result).toBeNull();
    });

    it('getByUXResearchIdPaginated should map items to the domain', async () => {
        await repository.createUXResearchResponse(
            new UXResearchResponse(
                { ok: true },
                responseDate,
                'ux-get-one',
                'u-1',
                undefined,
            ),
        );

        const result = await repository.getByUXResearchIdPaginated(
            'ux-get-one',
            1,
            15,
        );

        expect(result).not.toBeNull();
        expect(result?.items).toHaveLength(1);
        expect(result?.items[0]).toBeInstanceOf(UXResearchResponse);
        expect(result?.items[0].uxResearchId).toBe('ux-get-one');
        expect(result?.items[0].response).toEqual({ ok: true });
        expect(result?.items[0].userId).toBe('u-1');
        expect(result?.meta.totalItems).toBe(1);
    });

    it('deleteUXResearchResponse should do the soft delete by id', async () => {
        const saved = await repository.createUXResearchResponse(
            new UXResearchResponse(
                { x: 1 },
                responseDate,
                'ux-del',
                'user-del',
            ),
        );

        const deleted = await repository.deleteUXResearchResponse(saved.id);
        expect(deleted).toBe(true);

        const active = await repository.findOne({ where: { id: saved.id } });
        expect(active).toBeNull();

        const withDeleted = await repository.findOne({
            where: { id: saved.id },
            withDeleted: true,
        });
        expect(withDeleted).toBeDefined();
        expect(withDeleted?.deletedAt).not.toBeNull();
    });

    it('deleteUXResearchResponse should return false for non-existent id', async () => {
        const result = await repository.deleteUXResearchResponse(
            '00000000-0000-0000-0000-000000000000',
        );
        expect(result).toBe(false);
    });
});
