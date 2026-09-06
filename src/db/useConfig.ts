import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTINGS_PADRAO, type Settings } from './schema'

/**
 * Os ajustes do app. Enquanto o banco não responde (primeiro render), devolve
 * o padrão em vez de undefined — assim toda tela pode usar direto.
 */
export function useConfig(): Settings {
  return useLiveQuery(() => db.settings.get(1)) ?? SETTINGS_PADRAO
}
