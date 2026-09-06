import { beforeEach, describe, expect, it } from 'vitest'
import {
  finalizarSessao,
  iniciarSessao,
  registrarSerie,
  sessaoEmAndamento,
  ultimasSeries,
} from './queries'
import { db } from './schema'

async function limpar() {
  await Promise.all(db.tables.map((t) => t.clear()))
}

/** Um treino com um exercício, devolvendo o id do workoutExercise. */
async function montarProtocolo() {
  const workoutId = await db.workouts.add({ nome: 'Treino A', ordem: 0 } as never)
  const exerciseId = await db.exercises.add({
    nome: 'Supino reto',
    grupoMuscular: 'peito',
    cues: [],
  } as never)
  const workoutExerciseId = await db.workoutExercises.add({
    workoutId,
    exerciseId,
    ordem: 0,
    seriesAlvo: 3,
    repsAlvo: '8-12',
    descansoSeg: 90,
  } as never)
  return { workoutId, exerciseId, workoutExerciseId }
}

beforeEach(limpar)

describe('sessão', () => {
  it('não há sessão em andamento num app zerado', async () => {
    expect(await sessaoEmAndamento()).toBeUndefined()
  })

  it('iniciar cria uma sessão aberta e finalizar a fecha', async () => {
    const { workoutId } = await montarProtocolo()
    const sessionId = await iniciarSessao(workoutId)

    const aberta = await sessaoEmAndamento()
    expect(aberta?.id).toBe(sessionId)
    expect(aberta?.finalizadaEm).toBeUndefined()

    await finalizarSessao(sessionId, { sensacao: 4 })

    expect(await sessaoEmAndamento()).toBeUndefined()
    expect((await db.sessions.get(sessionId))?.sensacao).toBe(4)
  })

  it('iniciar devolve a sessão aberta em vez de criar outra', async () => {
    const { workoutId } = await montarProtocolo()
    const primeira = await iniciarSessao(workoutId)
    const segunda = await iniciarSessao(workoutId)

    expect(segunda).toBe(primeira)
    expect(await db.sessions.count()).toBe(1)
  })
})

describe('registrarSerie', () => {
  it('grava a série e sobrescreve ao reeditar o mesmo índice', async () => {
    const { workoutId, workoutExerciseId } = await montarProtocolo()
    const sessionId = await iniciarSessao(workoutId)

    await registrarSerie({ sessionId, workoutExerciseId, indiceSerie: 0, reps: 10, carga: 40 })
    await registrarSerie({ sessionId, workoutExerciseId, indiceSerie: 0, reps: 9, carga: 42.5 })

    const logs = await db.setLogs.toArray()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ reps: 9, carga: 42.5 })
  })
})

describe('ultimasSeries', () => {
  it('é vazio quando o exercício nunca foi feito', async () => {
    const { workoutExerciseId } = await montarProtocolo()
    expect(await ultimasSeries(workoutExerciseId)).toEqual([])
  })

  it('traz as séries da última sessão em que o exercício apareceu, em ordem', async () => {
    const { workoutId, workoutExerciseId } = await montarProtocolo()

    const antiga = await iniciarSessao(workoutId)
    await registrarSerie({ sessionId: antiga, workoutExerciseId, indiceSerie: 0, reps: 10, carga: 30 })
    await finalizarSessao(antiga)

    const recente = await iniciarSessao(workoutId)
    await registrarSerie({ sessionId: recente, workoutExerciseId, indiceSerie: 1, reps: 8, carga: 40 })
    await registrarSerie({ sessionId: recente, workoutExerciseId, indiceSerie: 0, reps: 10, carga: 40 })
    await finalizarSessao(recente)

    const series = await ultimasSeries(workoutExerciseId)
    expect(series.map((s) => s.indiceSerie)).toEqual([0, 1])
    expect(series.map((s) => s.carga)).toEqual([40, 40])
  })

  it('não considera a sessão atual, para o prefill não copiar a si mesmo', async () => {
    const { workoutId, workoutExerciseId } = await montarProtocolo()

    const anterior = await iniciarSessao(workoutId)
    await registrarSerie({ sessionId: anterior, workoutExerciseId, indiceSerie: 0, reps: 10, carga: 30 })
    await finalizarSessao(anterior)

    const atual = await iniciarSessao(workoutId)
    await registrarSerie({ sessionId: atual, workoutExerciseId, indiceSerie: 0, reps: 6, carga: 60 })

    const series = await ultimasSeries(workoutExerciseId, { ignorarSessionId: atual })
    expect(series.map((s) => s.carga)).toEqual([30])
  })
})
