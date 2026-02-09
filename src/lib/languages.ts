export interface LanguageConfig {
  code: string // ISO code: "es-ES", "pt-BR"
  name: string // Nombre friendly: "Español (España)"
  enabled: boolean // Configurable por admin
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'es-ES', name: 'Español (España)', enabled: true },
  { code: 'es-419', name: 'Español (Latinoamérica)', enabled: true },
  { code: 'pt-BR', name: 'Português (Brasil)', enabled: true },
  { code: 'pt-PT', name: 'Português (Portugal)', enabled: true },
  { code: 'en-US', name: 'English (US)', enabled: true },
  { code: 'en-GB', name: 'English (UK)', enabled: false },
  { code: 'fr-FR', name: 'Français', enabled: false },
  { code: 'de-DE', name: 'Deutsch', enabled: false },
  { code: 'it-IT', name: 'Italiano', enabled: false },
]

export const ENABLED_LANGUAGES = LANGUAGES.filter((l) => l.enabled)

export const getLanguageByCode = (code: string) =>
  LANGUAGES.find((l) => l.code === code)

export const getLanguageName = (code: string) =>
  getLanguageByCode(code)?.name || code
