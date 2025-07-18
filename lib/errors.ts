// =============================================================================
// ERROR CODES AND MESSAGES
// =============================================================================

// Service Tag Error Codes
export enum ServiceTagErrorCode {
  DUPLICATE_TAG = 'DUPLICATE_TAG',
  INVALID_CLIENT = 'INVALID_CLIENT',
  INVALID_FORMAT = 'INVALID_FORMAT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Service Tag Error Messages
export const SERVICE_TAG_ERROR_MESSAGES = {
  [ServiceTagErrorCode.DUPLICATE_TAG]: (tag: string) => `Ya existe un número de serie con el tag '${tag}' para este cliente`,
  [ServiceTagErrorCode.INVALID_CLIENT]: 'El cliente especificado no existe o no es válido',
  [ServiceTagErrorCode.INVALID_FORMAT]: 'El formato del número de serie no es válido',
  [ServiceTagErrorCode.UNKNOWN_ERROR]: (message: string) => `Error desconocido: ${message}`
}

// Generic Error Messages
export const GENERIC_ERROR_MESSAGES = {
  CREATE_ERROR: 'Error al crear el registro',
  UPDATE_ERROR: 'Error al actualizar el registro',
  DELETE_ERROR: 'Error al eliminar el registro',
  FETCH_ERROR: 'Error al obtener los datos',
  VALIDATION_ERROR: 'Error de validación en los datos proporcionados'
}
