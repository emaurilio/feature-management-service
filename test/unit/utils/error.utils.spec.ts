import { getErrorMessage, parseError } from 'src/common/utils/error.utils';

describe('error.utils', () => {
  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return string when error is a string', () => {
      expect(getErrorMessage('Custom error message')).toBe(
        'Custom error message',
      );
    });

    it('should convert number to string', () => {
      expect(getErrorMessage(404)).toBe('404');
    });

    it('should convert null to string', () => {
      expect(getErrorMessage(null)).toBe('null');
    });

    it('should convert undefined to string', () => {
      expect(getErrorMessage(undefined)).toBe('undefined');
    });

    it('should convert object to string', () => {
      expect(getErrorMessage({ code: 'ERR' })).toBe('[object Object]');
    });
  });

  describe('parseError', () => {
    it('should return message and stack from Error instance', () => {
      const error = new Error('Test error');
      const result = parseError(error);

      expect(result.message).toBe('Test error');
      expect(result.stack).toBeDefined();
      expect(typeof result.stack).toBe('string');
    });

    it('should return message only when error is a string', () => {
      const result = parseError('String error');

      expect(result).toEqual({ message: 'String error' });
      expect(result.stack).toBeUndefined();
    });

    it('should convert number to message', () => {
      const result = parseError(500);
      expect(result).toEqual({ message: '500' });
    });

    it('should convert null to message', () => {
      const result = parseError(null);
      expect(result).toEqual({ message: 'null' });
    });

    it('should convert undefined to message', () => {
      const result = parseError(undefined);
      expect(result).toEqual({ message: 'undefined' });
    });
  });
});
