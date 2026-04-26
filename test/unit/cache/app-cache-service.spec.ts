import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppCacheService } from 'src/common/cache/cache.service';
import { METRICS_OBSERVER } from 'src/common/metrics/metrics.observer';
import { Cache } from 'cache-manager';

describe('AppCacheService', () => {
    let service: AppCacheService;
    let cacheManager: jest.Mocked<Cache>;
    let metricsObserver: any;

    beforeEach(async () => {
        const cacheManagerMock = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        const metricsObserverMock = {
            recordCacheFailure: jest.fn(),
            recordCacheInvalidationFailure: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppCacheService,
                {
                    provide: CACHE_MANAGER,
                    useValue: cacheManagerMock,
                },
                {
                    provide: METRICS_OBSERVER,
                    useValue: metricsObserverMock,
                },
            ],
        }).compile();

        service = module.get<AppCacheService>(AppCacheService);
        cacheManager = module.get(CACHE_MANAGER);
        metricsObserver = module.get(METRICS_OBSERVER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('get', () => {
        it('should return null when cache returns undefined', async () => {
            cacheManager.get.mockResolvedValue(undefined);
            const result = await service.get('test-key');
            expect(result).toBeNull();
            expect(cacheManager.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null when cache returns null', async () => {
            cacheManager.get.mockResolvedValue(null);
            const result = await service.get('test-key');
            expect(result).toBeNull();
            expect(cacheManager.get).toHaveBeenCalledWith('test-key');
        });

        it('should return the value when cache returns boolean', async () => {
            cacheManager.get.mockResolvedValue(true);
            const result = await service.get('test-key');
            expect(result).toBe(true);
            expect(cacheManager.get).toHaveBeenCalledWith('test-key');
        });
    });

    describe('set', () => {
        it('should set the value in cache successfully', async () => {
            cacheManager.set.mockResolvedValue(undefined);
            await service.set('test-key', true, 100);
            expect(cacheManager.set).toHaveBeenCalledWith('test-key', true, 100);
            expect(metricsObserver.recordCacheFailure).not.toHaveBeenCalled();
        });

        it('should set the value in cache with default ttl if not provided', async () => {
            cacheManager.set.mockResolvedValue(undefined);
            await service.set('test-key', false);
            expect(cacheManager.set).toHaveBeenCalledWith('test-key', false, 3600);
            expect(metricsObserver.recordCacheFailure).not.toHaveBeenCalled();
        });

        it('should catch error, log and record metrics when cache set fails', async () => {
            const error = new Error('Cache connection failed');
            cacheManager.set.mockRejectedValue(error);

            await service.set('test-key', true, 100);

            expect(metricsObserver.recordCacheFailure).toHaveBeenCalledWith(
                'set',
                'test-key',
                'Cache connection failed'
            );
        });
    });

    describe('invalidateCacheEntityFlags', () => {
        it('should delete all keys successfully', async () => {
            cacheManager.del.mockResolvedValue(false);

            await service.invalidateCacheEntityFlags('1', 'my-feature', ['user1', 'user2']);

            expect(cacheManager.del).toHaveBeenCalledTimes(2);
            expect(cacheManager.del).toHaveBeenCalledWith('user1-my-feature-1');
            expect(cacheManager.del).toHaveBeenCalledWith('user2-my-feature-1');
            expect(metricsObserver.recordCacheInvalidationFailure).not.toHaveBeenCalled();
        });

        it('should catch error, log and record metrics when invalidation fails', async () => {
            const error = new Error('Redis down');
            cacheManager.del.mockRejectedValue(error);

            await service.invalidateCacheEntityFlags('1', 'my-feature', ['user1']);

            expect(metricsObserver.recordCacheInvalidationFailure).toHaveBeenCalledWith(
                'my-feature',
                '1',
                'Redis down'
            );
        });
    });
});
