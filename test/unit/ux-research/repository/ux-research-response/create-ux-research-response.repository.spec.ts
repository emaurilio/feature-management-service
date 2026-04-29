/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchResponseRepository } from 'src/ux-research/infraestructure/persistence/repositories/ux-research-response.repository';
import { UXResearchResponseEntity } from 'src/ux-research/infraestructure/persistence/entities/ux-research-response.entity';
import { UXResearchResponse } from 'src/ux-research/domain/entites/UXResearchResponse';

describe('UXResearchResponseRepository - createUXResearchResponse', () => {
  let repository: UXResearchResponseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UXResearchResponseRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<UXResearchResponseRepository>(
      UXResearchResponseRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create UX research response successfully', async () => {
    const uxResearchResponse = new UXResearchResponse(
      'response-data',
      new Date(),
      'ux-research-1',
      'user-1',
      'company-1',
    );

    const mockSavedEntity = {
      id: '1',
      uxResearchId: 'ux-research-1',
      companyId: 'company-1',
      userId: 'user-1',
      response: 'response-data',
      responseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchResponseEntity;

    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);

    const result = await repository.createUXResearchResponse(uxResearchResponse);

    expect(repository.save).toHaveBeenCalledWith(uxResearchResponse);
    expect(result).toEqual(mockSavedEntity);
  });

  it('should handle database errors gracefully', async () => {
    const uxResearchResponse = new UXResearchResponse(
      'response-data',
      new Date(),
      'ux-research-1',
      'user-1',
      'company-1',
    );

    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'save').mockRejectedValue(error);

    await expect(repository.createUXResearchResponse(uxResearchResponse))
      .rejects.toThrow('Database connection failed');

    expect(repository.save).toHaveBeenCalledWith(uxResearchResponse);
  });

  it('should work with different UX research response data', async () => {
    const uxResearchResponse = new UXResearchResponse(
      '{"rating": 5, "comments": "Great experience"}',
      new Date(),
      'ux-research-2',
      'user-2',
      'company-2',
    );

    const mockSavedEntity = {
      id: '2',
      uxResearchId: 'ux-research-2',
      companyId: 'company-2',
      userId: 'user-2',
      response: '{"rating": 5, "comments": "Great experience"}',
      responseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchResponseEntity;

    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);

    const result = await repository.createUXResearchResponse(uxResearchResponse);

    expect(repository.save).toHaveBeenCalledWith(uxResearchResponse);
    expect(result).toEqual(mockSavedEntity);
  });

  it('should handle null response data', async () => {
    const uxResearchResponse = new UXResearchResponse(
      null,
      new Date(),
      'ux-research-3',
      'user-3',
      'company-3',
    );

    const mockSavedEntity = {
      id: '3',
      uxResearchId: 'ux-research-3',
      companyId: 'company-3',
      userId: 'user-3',
      response: null,
      responseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchResponseEntity;

    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);

    const result = await repository.createUXResearchResponse(uxResearchResponse);

    expect(repository.save).toHaveBeenCalledWith(uxResearchResponse);
    expect(result).toEqual(mockSavedEntity);
  });
});