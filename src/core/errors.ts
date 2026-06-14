export class GeoError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'GeoError';
  }
}

export const ErrorCodes = {
  FileNotFound: 'GEO_E001',
  UnsupportedFormat: 'GEO_E002',
  SqlExecution: 'GEO_E003',
  OutputTruncated: 'GEO_E004',
  Network: 'GEO_E005',
  Crs: 'GEO_E006',
  UnsafeSql: 'GEO_E007',
} as const;

export function toAgentError(error: unknown) {
  if (error instanceof GeoError) {
    return {
      ok: false,
      code: error.code,
      error: error.message,
      detail: error.detail,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    code: ErrorCodes.SqlExecution,
    error: message,
  };
}
