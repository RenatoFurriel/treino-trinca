import { db, type SetLog } from './schema'

/** A sessão aberta, se houver. Só pode existir uma por vez. */
export async function sessaoEmAndamento() {
  return db.sessions.filter((s) => s.finalizadaEm === undefined).first()
}

/**
 * Abre uma sessão para o treino. Se já houver uma em andamento, devolve ela —
 * fechar e reabrir o app no meio do treino não pode criar sessões duplicadas.
 */
export async function iniciarSessao(workoutId: number): Promise<number> {
  const aberta = await sessaoEmAndamento()
  if (aberta) return aberta.id
  return db.sessions.add({ workoutId, iniciadaEm: Date.now() } as never)
}

export async function finalizarSessao(
  sessionId: number,
  dados: { sensacao?: number; obs?: string } = {},
) {
  await db.sessions.update(sessionId, { finalizadaEm: Date.now(), ...dados })
}

export interface SerieRegistrada {
  sessionId: number
  workoutExerciseId: number
  indiceSerie: number
  reps: number
  carga: number
  rpe?: number
}

/** Grava (ou corrige) uma série. Cada índice de série existe uma vez só. */
export async function registrarSerie(serie: SerieRegistrada): Promise<number> {
  const existente = await db.setLogs
    .where('sessionId')
    .equals(serie.sessionId)
    .filter(
      (s) =>
        s.workoutExerciseId === serie.workoutExerciseId && s.indiceSerie === serie.indiceSerie,
    )
    .first()

  if (existente) {
    await db.setLogs.update(existente.id, { ...serie, feitaEm: Date.now() })
    return existente.id
  }
  return db.setLogs.add({ ...serie, feitaEm: Date.now() } as never)
}

export async function apagarSerie(sessionId: number, workoutExerciseId: number, indiceSerie: number) {
  await db.setLogs
    .where('sessionId')
    .equals(sessionId)
    .filter((s) => s.workoutExerciseId === workoutExerciseId && s.indiceSerie === indiceSerie)
    .delete()
}

/**
 * As séries da última vez que esse exercício foi feito — a base do prefill de
 * carga e reps na tela de execução.
 */
export async function ultimasSeries(
  workoutExerciseId: number,
  opcoes: { ignorarSessionId?: number } = {},
): Promise<SetLog[]> {
  const logs = await db.setLogs.where('workoutExerciseId').equals(workoutExerciseId).toArray()
  const candidatos = logs.filter((s) => s.sessionId !== opcoes.ignorarSessionId)
  if (candidatos.length === 0) return []

  const ultimaSessionId = candidatos.reduce(
    (maior, s) => (s.sessionId > maior ? s.sessionId : maior),
    candidatos[0].sessionId,
  )

  return candidatos
    .filter((s) => s.sessionId === ultimaSessionId)
    .sort((a, b) => a.indiceSerie - b.indiceSerie)
}

export async function seriesDaSessao(sessionId: number): Promise<SetLog[]> {
  return db.setLogs.where('sessionId').equals(sessionId).toArray()
}
