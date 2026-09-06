/**
 * A agenda da semana: sete posições, domingo em 0, cada uma com o id do treino
 * do dia ou null para descanso.
 *
 * Mora dentro de `settings` (uma linha só, chave 1) de propósito. Quando era
 * uma tabela indexada pelo dia da semana, domingo ficava com a chave primária
 * 0 e o useLiveQuery do Dexie não disparava nessa chave: o dia gravava no
 * banco mas a tela nunca atualizava.
 */
export type Agenda = (number | null)[]

export const AGENDA_VAZIA: Agenda = [null, null, null, null, null, null, null]

function dentroDaSemana(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 0 && dia <= 6
}

export function treinoDoDia(agenda: Agenda | undefined, dia: number): number | null {
  if (!agenda || !dentroDaSemana(dia)) return null
  return agenda[dia] ?? null
}

export function definirDia(agenda: Agenda, dia: number, workoutId: number | null): Agenda {
  if (!dentroDaSemana(dia)) return agenda
  const nova = [...agenda]
  nova[dia] = workoutId
  return nova
}

/** Usado ao apagar um treino: os dias que apontavam para ele viram descanso. */
export function removerTreino(agenda: Agenda, workoutId: number): Agenda {
  return agenda.map((id) => (id === workoutId ? null : id))
}
