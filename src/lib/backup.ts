import { db } from '../db/schema'

/** Formato do arquivo de backup. Sem nuvem, este export é a rede de segurança. */
export interface Backup {
  formato: 'treino-backup'
  versao: 1
  exportadoEm: string
  dados: Record<string, unknown[]>
}

const TABELAS_EXPORTADAS = [
  'exercises',
  'workouts',
  'workoutExercises',
  'sessions',
  'setLogs',
  'settings',
] as const

export async function exportar(): Promise<Backup> {
  const dados: Record<string, unknown[]> = {}
  for (const nome of TABELAS_EXPORTADAS) {
    dados[nome] = await db.table(nome).toArray()
  }
  return {
    formato: 'treino-backup',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    dados,
  }
}

export function ehBackupValido(valor: unknown): valor is Backup {
  const b = valor as Backup | null
  return !!b && b.formato === 'treino-backup' && b.versao === 1 && typeof b.dados === 'object'
}

/** Substitui todo o conteúdo local pelo do arquivo. */
export async function importar(backup: unknown): Promise<void> {
  if (!ehBackupValido(backup)) {
    throw new Error('Arquivo não é um backup de treino válido.')
  }
  await db.transaction('rw', db.tables, async () => {
    for (const nome of TABELAS_EXPORTADAS) {
      await db.table(nome).clear()
      const linhas = backup.dados[nome]
      if (Array.isArray(linhas) && linhas.length > 0) {
        await db.table(nome).bulkAdd(linhas)
      }
    }
  })
}

export function baixarBackup(backup: Backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `treino-${backup.exportadoEm.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
