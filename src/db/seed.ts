import { db, SETTINGS_PADRAO, type GrupoMuscular } from './schema'

/**
 * Treino Trinca — protocolo personalizado da Lotz Academy (Pedro Lotz,
 * CREF 11765/MG), transcrito exatamente como está em pedrolotz.base44.app:
 * mesmos exercícios, mesma ordem, mesmas séries, reps e descansos.
 *
 * Frequência: 3x por semana, com pelo menos um dia de repouso entre os treinos.
 */
// As imagens vivem em public/exercicios e entram no precache do service
// worker: na academia sem sinal elas continuam aparecendo. BASE_URL respeita
// o subcaminho do GitHub Pages.
const MIDIA = `${import.meta.env.BASE_URL}exercicios/`

interface ExercicioSeed {
  nome: string
  grupoMuscular: GrupoMuscular
  /** A orientação curta que aparece embaixo do nome no protocolo. */
  cue: string
  series: number
  reps: string
  descansoSeg: number
  imagem: string
}

interface TreinoSeed {
  nome: string
  exercicios: ExercicioSeed[]
}

const AQUECIMENTO = (imagem: string): ExercicioSeed => ({
  nome: 'Aquecimento (como preferir)',
  grupoMuscular: 'cardio',
  cue: 'Prepare seu corpo para o treino',
  series: 1,
  reps: '3 a 5 minutos',
  descansoSeg: 0,
  imagem,
})

const CARDIO = (imagem: string): ExercicioSeed => ({
  nome: 'Cardio (esteira, bike ou elíptico)',
  grupoMuscular: 'cardio',
  cue: 'Ritmo moderado — 15 minutos, seu melhor ritmo',
  series: 1,
  reps: '15 minutos',
  descansoSeg: 0,
  imagem,
})

export const PROTOCOLO_PADRAO: TreinoSeed[] = [
  {
    nome: 'Treino 1',
    exercicios: [
      AQUECIMENTO('corrida.png'),
      {
        nome: 'Abdominal com rolinho',
        grupoMuscular: 'core',
        cue: 'Controle do movimento',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'abdominal-com-rolinho.png',
      },
      {
        nome: 'Agachamento livre',
        grupoMuscular: 'quadriceps',
        cue: 'Amplitude máxima',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'agachamento-livre.png',
      },
      {
        nome: 'Cadeira extensora',
        grupoMuscular: 'quadriceps',
        cue: 'Contração do quadríceps',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'cadeira-extensora.png',
      },
      {
        nome: 'Remada curvada com barra',
        grupoMuscular: 'costas',
        cue: 'Lombar encaixada',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'remada-curvada-com-barra.png',
      },
      {
        nome: 'Supino reto com barra',
        grupoMuscular: 'peito',
        cue: 'Produção de força',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'supino-reto-com-barra.png',
      },
      {
        nome: 'Rosca direta com barra reta',
        grupoMuscular: 'biceps',
        cue: 'Alongamento do bíceps',
        series: 3,
        reps: '10',
        descansoSeg: 50,
        imagem: 'rosca-direta-com-barra.png',
      },
      {
        nome: 'Tríceps corda no pulley',
        grupoMuscular: 'triceps',
        cue: 'Cotovelos fixos, extensão do tríceps',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'triceps-corda-no-cabo.png',
      },
      CARDIO('corrida.png'),
    ],
  },
  {
    nome: 'Treino 2',
    exercicios: [
      AQUECIMENTO('corrida.png'),
      {
        nome: 'Abdominal declinado com peso',
        grupoMuscular: 'core',
        cue: 'Tronco controlado',
        series: 3,
        reps: '15',
        descansoSeg: 50,
        imagem: 'abdominal-declinado-com-peso.png',
      },
      {
        nome: 'Leg press 45°',
        grupoMuscular: 'quadriceps',
        cue: 'Força total',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'leg-press-45.png',
      },
      {
        nome: 'Levantamento terra com barra',
        grupoMuscular: 'posterior',
        cue: 'Atenção na postura',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'levantamento-terra-com-barra.png',
      },
      {
        nome: 'Panturrilha no leg press',
        grupoMuscular: 'panturrilha',
        cue: 'Amplitude total',
        series: 4,
        reps: '12',
        descansoSeg: 50,
        imagem: 'panturrilha-no-leg-press.png',
      },
      {
        nome: 'Puxada frontal aberta',
        grupoMuscular: 'costas',
        cue: 'Alonga tudo, volta espremendo',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'puxada-frontal-aberta.png',
      },
      {
        nome: 'Supino inclinado com halteres',
        grupoMuscular: 'peito',
        cue: 'Foco no peitoral superior',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'supino-inclinado-com-halteres.png',
      },
      {
        nome: 'Elevação lateral com halteres',
        grupoMuscular: 'ombro',
        cue: 'Projeta as mãos pra longe',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'elevacao-lateral-com-halteres.png',
      },
      CARDIO('corrida.png'),
    ],
  },
  {
    nome: 'Treino 3',
    exercicios: [
      AQUECIMENTO('corrida.png'),
      {
        nome: 'Abdominal infra na barra livre',
        grupoMuscular: 'core',
        cue: 'Tronco parado, traga as pernas',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'abdominal-infra-na-barra-livre.png',
      },
      {
        nome: 'Hack squat',
        grupoMuscular: 'quadriceps',
        cue: 'Foque na amplitude',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'hack-squat.png',
      },
      {
        nome: 'Stiff com barra',
        grupoMuscular: 'posterior',
        cue: 'Atenção ao tronco',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'stiff-com-barra.png',
      },
      {
        nome: 'Remada fechada unilateral com halter',
        grupoMuscular: 'costas',
        cue: 'Aumento da amplitude',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'remada-fechada-unilateral-com-halter.png',
      },
      {
        nome: 'Crucifixo na máquina',
        grupoMuscular: 'peito',
        cue: 'Contração total do peitoral',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'crucifixo-na-maquina.png',
      },
      {
        nome: 'Desenvolvimento com halteres sentado',
        grupoMuscular: 'ombro',
        cue: 'Cotovelos alinhados aos ombros',
        series: 4,
        reps: '10',
        descansoSeg: 50,
        imagem: 'desenvolvimento-com-halteres.png',
      },
      {
        nome: 'Tríceps testa com halter',
        grupoMuscular: 'triceps',
        cue: 'Cotovelos fixos e estáveis',
        series: 3,
        reps: '12',
        descansoSeg: 50,
        imagem: 'triceps-testa-com-halter.png',
      },
      CARDIO('corrida.png'),
    ],
  },
]

/** 3x na semana com um dia de repouso entre os treinos, como pede o protocolo. */
const AGENDA_PADRAO = [null, 0, null, 1, null, 2, null]

/** Popula o banco na primeira abertura. Não faz nada se já houver treinos. */
export async function semearSeVazio(protocolo: TreinoSeed[] = PROTOCOLO_PADRAO) {
  if ((await db.workouts.count()) > 0) return

  await db.transaction('rw', db.tables, async () => {
    await db.settings.put(SETTINGS_PADRAO)

    const idsDosTreinos: number[] = []

    for (const [ordem, treino] of protocolo.entries()) {
      const workoutId = await db.workouts.add({ nome: treino.nome, ordem } as never)
      idsDosTreinos.push(workoutId)

      for (const [i, ex] of treino.exercicios.entries()) {
        const exerciseId = await db.exercises.add({
          nome: ex.nome,
          grupoMuscular: ex.grupoMuscular,
          cues: [ex.cue],
          mediaUrl: MIDIA + ex.imagem,
        } as never)

        await db.workoutExercises.add({
          workoutId,
          exerciseId,
          ordem: i,
          seriesAlvo: ex.series,
          repsAlvo: ex.reps,
          descansoSeg: ex.descansoSeg,
        } as never)
      }
    }

    await db.schedule.bulkPut(
      AGENDA_PADRAO.map((indice, diaDaSemana) => ({
        diaDaSemana,
        workoutId: indice === null ? null : (idsDosTreinos[indice] ?? null),
      })),
    )
  })
}
