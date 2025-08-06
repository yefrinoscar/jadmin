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

// User Error Codes
export enum UserErrorCode {
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  INVALID_ROLE = 'INVALID_ROLE',
  INVALID_CLIENT = 'INVALID_CLIENT',
  MISSING_CLIENT = 'MISSING_CLIENT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_NOT_FOUND_IN_AUTHENTICATION = 'USER_NOT_FOUND_IN_AUTHENTICATION',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  INVALID_EMAIL = 'INVALID_EMAIL',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EMAIL_SENDING_FAILED = 'EMAIL_SENDING_FAILED',
  USER_HAS_TICKETS = 'USER_HAS_TICKETS',
  ROLE_CHANGE_FORBIDDEN = 'ROLE_CHANGE_FORBIDDEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// User Error Messages in Spanish
export const USER_ERROR_MESSAGES = {
  [UserErrorCode.EMAIL_EXISTS]: 'El correo electrónico ya está registrado',
  [UserErrorCode.INVALID_ROLE]: 'El rol especificado no es válido',
  [UserErrorCode.INVALID_CLIENT]: 'El cliente especificado no existe o no es válido',
  [UserErrorCode.MISSING_CLIENT]: 'Se requiere seleccionar un cliente para usuarios con rol de cliente',
  [UserErrorCode.INSUFFICIENT_PERMISSIONS]: 'No tienes permisos suficientes para realizar esta acción',
  [UserErrorCode.USER_NOT_FOUND]: 'Usuario no encontrado',
  [UserErrorCode.USER_NOT_FOUND_IN_AUTHENTICATION]: 'Usuario no encontrado en el sistema de autenticación',
  [UserErrorCode.PASSWORD_TOO_WEAK]: 'La contraseña debe tener al menos 6 caracteres',
  [UserErrorCode.INVALID_EMAIL]: 'Por favor ingresa una dirección de correo electrónico válida',
  [UserErrorCode.REGISTRATION_FAILED]: 'Error al registrar el usuario en el sistema de autenticación',
  [UserErrorCode.DATABASE_ERROR]: (message: string) => `Error en la base de datos: ${message}`,
  [UserErrorCode.EMAIL_SENDING_FAILED]: 'Error al enviar el correo electrónico de bienvenida',
  [UserErrorCode.USER_HAS_TICKETS]: 'No se puede eliminar el usuario porque tiene tickets asignados. Por favor, reasígnalos primero',
  [UserErrorCode.ROLE_CHANGE_FORBIDDEN]: 'No se puede cambiar el rol del usuario después de la creación',
  [UserErrorCode.UNKNOWN_ERROR]: (message: string) => `Error desconocido: ${message}`
}

// Generic Error Messages
export const GENERIC_ERROR_MESSAGES = {
  CREATE_ERROR: 'Error al crear el registro',
  UPDATE_ERROR: 'Error al actualizar el registro',
  DELETE_ERROR: 'Error al eliminar el registro',
  FETCH_ERROR: 'Error al obtener los datos',
  VALIDATION_ERROR: 'Error de validación en los datos proporcionados'
}
