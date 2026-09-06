import { describe, expect, it } from 'vitest'
import type { SetLog } from '../db/schema'
import { aderenciaDaSemana, cargaMaxima, inicioDaSemana, volume } from './metrics'

const log = (p: Partial<SetLog>): SetLog => ({
  id: 1,
  sessionId: 1,
  workoutExerciseId: 1,
  indiceSerie: 0,
  reps: 10,
  carga: 20,
  feitaEm: 0,
  ...p,
})

describe('volume', () => {
  it('soma reps x carga de cada série', () => {
    expect(volume([log({ reps: 10, carga: 20 }), log({ reps: 8, carga: 25 })])).toBe(400)
  })

  it('é zero sem séries', () => {
    expect(volume([])).toBe(0)
  })

  it('ignora séries com carga zero mas conta as reps como volume nulo', () => {
    expect(volume([log({ reps: 15, carga: 0 })])).toBe(0)
  })
})

describe('cargaMaxima', () => {
  it('devolve a maior carga levantada', () => {
    expect(cargaMaxima([log({ carga: 20 }), log({ carga: 32.5 }), log({ carga: 30 })])).toBe(32.5)
  })

  it('devolve null sem séries', () => {
    expect(cargaMaxima([])).toBeNull()
  })
})

describe('inicioDaSemana', () => {
  it('volta para o domingo à meia-noite', () => {
    // Quarta, 03/09/2025 14:32 local.
    const inicio = inicioDaSemana(new Date(2025, 8, 3, 14, 32))
    expect(inicio.getDay()).toBe(0)
    expect(inicio.getDate()).toBe(31) // domingo, 31/08
    expect(inicio.getHours()).toBe(0)
    expect(inicio.getMinutes()).toBe(0)
  })

  it('num domingo devolve o próprio dia', () => {
    const inicio = inicioDaSemana(new Date(2025, 8, 7, 23, 59))
    expect(inicio.getDate()).toBe(7)
    expect(inicio.getHours()).toBe(0)
  })
})

describe('aderenciaDaSemana', () => {
  const agenda = [
    { diaDaSemana: 0, workoutId: null },
    { diaDaSemana: 1, workoutId: 10 },
    { diaDaSemana: 2, workoutId: 11 },
    { diaDaSemana: 3, workoutId: null },
    { diaDaSemana: 4, workoutId: 10 },
    { diaDaSemana: 5, workoutId: 11 },
    { diaDaSemana: 6, workoutId: null },
  ]
  // Semana de domingo 31/08 a sábado 06/09/2025.
  const hoje = new Date(2025, 8, 5, 12, 0) // sexta

  it('conta como planejados só os dias com treino até hoje', () => {
    // Seg, ter, qui, sex = 4 planejados até sexta.
    const r = aderenciaDaSemana([], agenda, hoje)
    expect(r.planejados).toBe(4)
    expect(r.feitos).toBe(0)
  })

  it('conta sessões finalizadas da semana', () => {
    const sessoes = [
      { id: 1, workoutId: 10, iniciadaEm: new Date(2025, 8, 1, 19).getTime(), finalizadaEm: new Date(2025, 8, 1, 20).getTime() },
      { id: 2, workoutId: 11, iniciadaEm: new Date(2025, 8, 2, 19).getTime(), finalizadaEm: new Date(2025, 8, 2, 20).getTime() },
    ]
    expect(aderenciaDaSemana(sessoes, agenda, hoje).feitos).toBe(2)
  })

  it('ignora sessões em andamento e de semanas anteriores', () => {
    const sessoes = [
      { id: 1, workoutId: 10, iniciadaEm: new Date(2025, 8, 1, 19).getTime() }, // sem finalizadaEm
      { id: 2, workoutId: 10, iniciadaEm: new Date(2025, 7, 26, 19).getTime(), finalizadaEm: new Date(2025, 7, 26, 20).getTime() },
    ]
    expect(aderenciaDaSemana(sessoes, agenda, hoje).feitos).toBe(0)
  })
})
