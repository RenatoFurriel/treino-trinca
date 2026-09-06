import type { Agenda } from '../db/agenda'
import type { Session, SetLog } from '../db/schema'

/** Volume de trabalho: soma de reps x carga. */
export function volume(logs: readonly SetLog[]): number {
  return logs.reduce((total, s) => total + s.reps * s.carga, 0)
}

/** Maior carga entre as séries, ou null se não houver nenhuma. */
export function cargaMaxima(logs: readonly SetLog[]): number | null {
  if (logs.length === 0) return null
  return logs.reduce((maior, s) => (s.carga > maior ? s.carga : maior), logs[0].carga)
}

/** Domingo à meia-noite da semana de `data`. */
export function inicioDaSemana(data: Date): Date {
  const inicio = new Date(data)
  inicio.setHours(0, 0, 0, 0)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  return inicio
}

export interface Aderencia {
  planejados: number
  feitos: number
}

/**
 * Quantos treinos a agenda pedia até hoje e quantos foram de fato finalizados
 * nesta semana. Dias futuros da semana não contam contra você.
 */
export function aderenciaDaSemana(
  sessoes: readonly Pick<Session, 'finalizadaEm'>[],
  agenda: Agenda,
  hoje: Date,
): Aderencia {
  const planejados = agenda.filter(
    (workoutId, diaDaSemana) => workoutId !== null && diaDaSemana <= hoje.getDay(),
  ).length

  const inicio = inicioDaSemana(hoje).getTime()
  const fim = inicio + 7 * 24 * 60 * 60 * 1000
  const feitos = sessoes.filter(
    (s) => s.finalizadaEm !== undefined && s.finalizadaEm >= inicio && s.finalizadaEm < fim,
  ).length

  return { planejados, feitos }
}
