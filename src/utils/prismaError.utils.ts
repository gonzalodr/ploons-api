import { StatusCodes } from 'http-status-codes';

interface PrismaErrorInfo {
  statusCode: number;
  message: string;
}

const PRISMA_ERROR_MAP: Record<string, PrismaErrorInfo> = {
  P1000: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database authentication failed' },
  P1001: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Cannot connect to database' },
  P1002: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database connection timed out' },
  P1003: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database does not exist' },
  P1008: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database connection was refused' },
  P1009: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database already exists' },
  P1010: { statusCode: StatusCodes.FORBIDDEN, message: 'Access denied to database' },
  P1011: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Error opening database connection' },
  P1012: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database schema validation error' },
  P1013: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database query provided invalid data' },
  P1015: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database connector returned an error' },
  P1016: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Raw query returned incorrect number of columns' },
  P1017: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database server has closed the connection' },
  P2000: { statusCode: StatusCodes.BAD_REQUEST, message: 'Provided value is too long for the field' },
  P2001: { statusCode: StatusCodes.NOT_FOUND, message: 'Record does not exist' },
  P2002: { statusCode: StatusCodes.CONFLICT, message: 'Value already in use' },
  P2003: { statusCode: StatusCodes.BAD_REQUEST, message: 'Referenced record does not exist' },
  P2004: { statusCode: StatusCodes.CONFLICT, message: 'Constraint failed on the database' },
  P2005: { statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid value type for the field' },
  P2006: { statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid value provided for the field' },
  P2007: { statusCode: StatusCodes.BAD_REQUEST, message: 'Database constraint validation error' },
  P2008: { statusCode: StatusCodes.BAD_REQUEST, message: 'Query parsing failed' },
  P2009: { statusCode: StatusCodes.BAD_REQUEST, message: 'Query validation failed' },
  P2010: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Raw query execution failed' },
  P2011: { statusCode: StatusCodes.BAD_REQUEST, message: 'Required field has no value' },
  P2012: { statusCode: StatusCodes.BAD_REQUEST, message: 'Missing required field' },
  P2013: { statusCode: StatusCodes.BAD_REQUEST, message: 'Missing required argument' },
  P2014: { statusCode: StatusCodes.CONFLICT, message: 'Relation violation: the record would break required relationships' },
  P2015: { statusCode: StatusCodes.NOT_FOUND, message: 'Related record not found' },
  P2016: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Query interpretation error' },
  P2017: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Records linked by relation are not connected' },
  P2018: { statusCode: StatusCodes.NOT_FOUND, message: 'Required connected records not found' },
  P2019: { statusCode: StatusCodes.BAD_REQUEST, message: 'Input error: wrong data type' },
  P2020: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Value out of range for the field type' },
  P2021: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Table does not exist in the database' },
  P2022: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Column does not exist in the database' },
  P2023: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Inconsistent column data' },
  P2024: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'Database query timed out' },
  P2025: { statusCode: StatusCodes.NOT_FOUND, message: 'Record not found' },
  P2026: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Unsupported database feature' },
  P2027: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Multiple database errors occurred' },
  P2028: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database transaction failed' },
  P2029: { statusCode: StatusCodes.BAD_REQUEST, message: 'Query parameter limit exceeded' },
  P2030: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database search exceeded available resources' },
  P2031: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database query execution failed' },
  P2033: { statusCode: StatusCodes.BAD_REQUEST, message: 'Number provided is too large for the field' },
  P2034: { statusCode: StatusCodes.CONFLICT, message: 'Transaction failed due to concurrent updates' },
  P2035: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Database assertion failed' },
  P2036: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Error in external database connector' },
  P2037: { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Too many database connections opened' },
};

export function handlePrismaError(err: { code?: string; meta?: Record<string, unknown> }): PrismaErrorInfo | null {
  const code = err.code;
  if (!code) return null;

  const mapped = PRISMA_ERROR_MAP[code];
  if (!mapped) return null;

  if (code === 'P2002' && err.meta?.target) {
    const target = Array.isArray(err.meta.target) ? (err.meta.target as string[]).join(', ') : String(err.meta.target);
    return { ...mapped, message: `${target} is already in use` };
  }

  if (code === 'P2003' && err.meta?.field_name) {
    return { ...mapped, message: `Referenced record for ${String(err.meta.field_name)} does not exist` };
  }

  if (code === 'P2014' && err.meta?.relation_name) {
    return { ...mapped, message: `Relation violation on ${String(err.meta.relation_name)}` };
  }

  if (code === 'P2025' && err.meta?.modelName) {
    return { ...mapped, message: `${String(err.meta.modelName)} not found` };
  }

  return mapped;
}
