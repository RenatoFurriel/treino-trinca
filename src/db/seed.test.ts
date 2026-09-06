import { beforeEach, describe, expect, it } from 'vitest'
import { semearSeVazio } from './seed'
import { db } from './schema'

/**
 * Trava a transcrição do Treino Trinca: se alguém mexer no seed, estes números
 * e nomes têm que continuar batendo com o que está em pedrolotz.base44.app.
 */
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

async function exerciciosDe(nomeDoTreino: string) {
  const treino = await db.workouts.filter((w) => w.nome === nomeDoTreino).first()
  const wes = await db.workoutExercises.where('workoutId').equals(treino!.id).sortBy('ordem')
  return Promise.all(
    wes.map(async (we) => {
      const ex = await db.exercises.get(we.exerciseId)
      return `${ex!.nome} ${we.seriesAlvo}x${we.repsAlvo} ${we.descansoSeg}s`
    }),
  )
}

describe('protocolo Treino Trinca', () => {
  beforeEach(() => semearSeVazio())

  it('tem exatamente os três treinos', async () => {
    const nomes = (await db.workouts.orderBy('ordem').toArray()).map((w) => w.nome)
    expect(nomes).toEqual(['Treino 1', 'Treino 2', 'Treino 3'])
  })

  it('Treino 1 na ordem e nas cargas do protocolo', async () => {
    expect(await exerciciosDe('Treino 1')).toEqual([
      'Aquecimento (como preferir) 1x3 a 5 minutos 0s',
      'Abdominal com rolinho 3x12 50s',
      'Agachamento livre 4x10 50s',
      'Cadeira extensora 3x12 50s',
      'Remada curvada com barra 4x10 50s',
      'Supino reto com barra 4x10 50s',
      'Rosca direta com barra reta 3x10 50s',
      'Tríceps corda no pulley 3x12 50s',
      'Cardio (esteira, bike ou elíptico) 1x15 minutos 0s',
    ])
  })

  it('Treino 2 na ordem e nas cargas do protocolo', async () => {
    expect(await exerciciosDe('Treino 2')).toEqual([
      'Aquecimento (como preferir) 1x3 a 5 minutos 0s',
      'Abdominal declinado com peso 3x15 50s',
      'Leg press 45° 4x10 50s',
      'Levantamento terra com barra 4x10 50s',
      'Panturrilha no leg press 4x12 50s',
      'Puxada frontal aberta 4x10 50s',
      'Supino inclinado com halteres 4x10 50s',
      'Elevação lateral com halteres 3x12 50s',
      'Cardio (esteira, bike ou elíptico) 1x15 minutos 0s',
    ])
  })

  it('Treino 3 na ordem e nas cargas do protocolo', async () => {
    expect(await exerciciosDe('Treino 3')).toEqual([
      'Aquecimento (como preferir) 1x3 a 5 minutos 0s',
      'Abdominal infra na barra livre 3x12 50s',
      'Hack squat 4x10 50s',
      'Stiff com barra 4x10 50s',
      'Remada fechada unilateral com halter 4x10 50s',
      'Crucifixo na máquina 4x10 50s',
      'Desenvolvimento com halteres sentado 4x10 50s',
      'Tríceps testa com halter 3x12 50s',
      'Cardio (esteira, bike ou elíptico) 1x15 minutos 0s',
    ])
  })

  it('todo exercício tem imagem de execução e a orientação do protocolo', async () => {
    const exercicios = await db.exercises.toArray()
    expect(exercicios).toHaveLength(27)
    for (const ex of exercicios) {
      expect(ex.mediaUrl).toMatch(/^\/exercicios\/[a-z0-9-]+\.png$/)
      expect(ex.cues[0]?.length).toBeGreaterThan(0)
    }
  })

  it('agenda 3x por semana com um dia de repouso entre os treinos', async () => {
    const agenda = await db.schedule.orderBy('diaDaSemana').toArray()
    const comTreino = agenda.filter((d) => d.workoutId !== null).map((d) => d.diaDaSemana)
    expect(comTreino).toEqual([1, 3, 5]) // segunda, quarta, sexta
  })

  it('não semeia de novo se já houver treinos', async () => {
    await semearSeVazio()
    expect(await db.workouts.count()).toBe(3)
  })
})
