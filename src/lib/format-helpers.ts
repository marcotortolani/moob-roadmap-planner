/**
 * Helper functions to format codes into human-readable names
 */

import { COUNTRIES } from './countries'

/**
 * Convert country code to country name
 * @param code - ISO country code (e.g., "VE", "ES", "MX")
 * @returns Country name in Spanish (e.g., "Venezuela", "España", "México")
 */
export function getCountryName(code: string): string {
  const country = COUNTRIES.find(c => c.code === code)
  return country ? country.name : code // Fallback to code if not found
}

/**
 * Language code to name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
  // Spanish variants
  'es': 'Español',
  'es-ES': 'Español (España)',
  'es-MX': 'Español (México)',
  'es-AR': 'Español (Argentina)',
  'es-CO': 'Español (Colombia)',
  'es-CL': 'Español (Chile)',
  'es-PE': 'Español (Perú)',
  'es-VE': 'Español (Venezuela)',
  'es-419': 'Español (Latinoamérica)',

  // Portuguese variants
  'pt': 'Portugués',
  'pt-BR': 'Portugués (Brasil)',
  'pt-PT': 'Portugués (Portugal)',

  // English variants
  'en': 'Inglés',
  'en-US': 'Inglés (Estados Unidos)',
  'en-GB': 'Inglés (Reino Unido)',
  'en-CA': 'Inglés (Canadá)',
  'en-AU': 'Inglés (Australia)',

  // French
  'fr': 'Francés',
  'fr-FR': 'Francés (Francia)',
  'fr-CA': 'Francés (Canadá)',

  // German
  'de': 'Alemán',
  'de-DE': 'Alemán (Alemania)',
  'de-AT': 'Alemán (Austria)',
  'de-CH': 'Alemán (Suiza)',

  // Italian
  'it': 'Italiano',
  'it-IT': 'Italiano (Italia)',

  // Other languages
  'ca': 'Catalán',
  'eu': 'Euskera',
  'gl': 'Gallego',
  'nl': 'Neerlandés',
  'ru': 'Ruso',
  'zh': 'Chino',
  'ja': 'Japonés',
  'ko': 'Coreano',
  'ar': 'Árabe',
}

/**
 * Convert language code to language name
 * @param code - Language code (e.g., "es-419", "en-US", "pt-BR")
 * @returns Language name in Spanish (e.g., "Español (Latinoamérica)", "Inglés (Estados Unidos)")
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code // Fallback to code if not found
}
