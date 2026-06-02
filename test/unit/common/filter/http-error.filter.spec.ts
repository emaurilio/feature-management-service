import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { HttpErrorFilter } from 'src/modules/common/filter/http-error.filter';

describe('HttpErrorFilter', () => {
  const filter = new HttpErrorFilter();

  it('should format HttpException responses', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new BadRequestException('Percentage is required for this feature flag type'),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 400,
        message: 'Percentage is required for this feature flag type',
      },
    });
  });

  it('should map plain Error to internal server error response', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('Failed to delete old feature flag'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 500,
        message: 'Failed to delete old feature flag',
      },
    });
  });
});
