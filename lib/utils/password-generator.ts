/**
 * Generates a secure random password with specified characteristics
 * @param length Length of the password (default: 12)
 * @param includeUppercase Include uppercase letters (default: true)
 * @param includeLowercase Include lowercase letters (default: true)
 * @param includeNumbers Include numbers (default: true)
 * @param includeSpecial Include special characters (default: true)
 * @returns A randomly generated password string
 */
export function generateSecurePassword(
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSpecial = true
): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  let availableChars = '';
  let password = '';
  
  // Build the character set based on options
  if (includeUppercase) availableChars += uppercaseChars;
  if (includeLowercase) availableChars += lowercaseChars;
  if (includeNumbers) availableChars += numberChars;
  if (includeSpecial) availableChars += specialChars;
  
  // Ensure we have at least some characters to work with
  if (availableChars.length === 0) {
    availableChars = lowercaseChars + numberChars;
  }
  
  // Generate the password
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    password += availableChars[randomIndex];
  }
  
  return password;
}

/**
 * Generates a simple but readable password (easier for users to remember)
 * Format: Word + Number + Special
 * @param options Configuration options for password generation
 * @returns A readable password string
 */
export function generateReadablePassword(options?: {
  minLength?: number;
  includeSpecial?: boolean;
  includeNumber?: boolean;
  capitalize?: boolean;
  language?: 'es' | 'en';
}): string {
  // Default options
  const {
    minLength = 8,
    includeSpecial = true,
    includeNumber = true,
    capitalize = true,
    language = 'es'
  } = options || {};

  // Word lists by language
  const wordLists = {
    es: [
      'Seguro', 'Acceso', 'Usuario', 'Sistema', 'Cuenta', 'Entrada', 
      'Tecnico', 'Soporte', 'Servicio', 'Admin', 'Clave', 'Ticket',
      'Proyecto', 'Equipo', 'Gestion', 'Control', 'Portal', 'Modulo',
      'Recurso', 'Datos', 'Archivo', 'Proceso', 'Cliente', 'Valor'
    ],
    en: [
      'Secure', 'Access', 'User', 'System', 'Account', 'Entry',
      'Tech', 'Support', 'Service', 'Admin', 'Password', 'Ticket',
      'Project', 'Team', 'Manage', 'Control', 'Portal', 'Module',
      'Resource', 'Data', 'File', 'Process', 'Client', 'Value'
    ]
  };

  // Select words based on language
  const words = wordLists[language];
  
  // Generate base components
  let randomWord = words[Math.floor(Math.random() * words.length)];
  if (capitalize) {
    randomWord = randomWord.charAt(0).toUpperCase() + randomWord.slice(1);
  }
  
  // Generate number component (ensure at least 3 digits)
  const randomNumber = includeNumber ? 
    Math.floor(Math.random() * 900) + 100 : 
    '';
  
  // Generate special character component
  const specialChars = '!@#$%&*';
  const randomSpecial = includeSpecial ? 
    specialChars[Math.floor(Math.random() * specialChars.length)] : 
    '';
  
  // Combine components
  let password = `${randomWord}${randomNumber}${randomSpecial}`;
  
  // Ensure minimum length
  while (password.length < minLength) {
    if (includeNumber) {
      password += Math.floor(Math.random() * 10);
    } else if (includeSpecial) {
      password += specialChars[Math.floor(Math.random() * specialChars.length)];
    } else {
      password += randomWord.charAt(Math.floor(Math.random() * randomWord.length));
    }
  }
  
  return password;
}
