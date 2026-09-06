import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { SETTINGS_PADRAO, TreinoDB } from './schema'

/**
 * Quem já usava o app tem um banco v1, com a agenda numa tabela indexada pelo
 * dia da semana. Abrir a versão nova não pode perder essa agenda.
 */
function bancoAntigo(nome: string) {
  const antigo = new Dexie(nome)
  antigo.version(1).stores({
    exercises: '++id, nome, grupoMuscular',
    workouts: '++id, ordem',
    workoutExercises: '++id, workoutId, exerciseId, [workoutId+ordem]',
    sessions: '++id, workoutId, iniciadaEm, finalizadaEm',
    setLogs: '++id, sessionId, workoutExerciseId, feitaEm',
    schedule: 'diaDaSemana',
    settings: 'id',
    mediaBlobs: '++id',
  })
  return antigo
}

describe('migração da agenda para settings', () => {
  it('traz a agenda antiga, domingo incluído', async () => {
    const nome = 'migracao-completa'
    const antigo = bancoAntigo(nome)
    await antigo.table('settings').put({ ...SETTINGS_PADRAO, agenda: undefined })
    await antigo.table('schedule').bulkPut([
      { diaDaSemana: 0, workoutId: 7 }, // domingo com treino: o caso que quebrava
      { diaDaSemana: 1, workoutId: null },
      { diaDaSemana: 2, workoutId: 9 },
      { diaDaSemana: 3, workoutId: null },
      { diaDaSemana: 4, workoutId: null },
      { diaDaSemana: 5, workoutId: 9 },
      { diaDaSemana: 6, workoutId: null },
    ])
    antigo.close()

    const novo = new TreinoDB(nome)
    const config = await novo.settings.get(1)
    expect(config?.agenda).toEqual([7, null, 9, null, null, 9, null])
    novo.close()
  })

  it('sobrevive a um banco antigo sem nenhuma agenda gravada', async () => {
    const nome = 'migracao-vazia'
    const antigo = bancoAntigo(nome)
    await antigo.table('settings').put({ ...SETTINGS_PADRAO, agenda: undefined })
    antigo.close()

    const novo = new TreinoDB(nome)
    const config = await novo.settings.get(1)
    expect(config?.agenda).toEqual([null, null, null, null, null, null, null])
    novo.close()
  })

  it('não deixa a tabela schedule para trás', async () => {
    const nome = 'migracao-tabelas'
    const antigo = bancoAntigo(nome)
    await antigo.table('settings').put(SETTINGS_PADRAO)
    antigo.close()

    const novo = new TreinoDB(nome)
    await novo.open()
    expect(novo.tables.map((t) => t.name)).not.toContain('schedule')
    novo.close()
  })
})
