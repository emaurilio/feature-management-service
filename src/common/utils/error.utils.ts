/**
 * Extrai a mensagem de erro de forma segura
 * @param error - Erro capturado no catch
 * @returns Mensagem de erro como string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Extrai todo o objeto de erro tipado
 * @param error - Erro capturado no catch
 * @returns Objeto com mensagem e stack
 */
export function parseError(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}
