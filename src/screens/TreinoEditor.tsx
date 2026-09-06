import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { Cabecalho } from '../components/Cabecalho'
import { db, type Exercise, type WorkoutExercise } from '../db/schema'
import { removerTreino } from '../db/agenda'
import { useConfig } from '../db/useConfig'

export function TreinoEditor() {
  const workoutId = Number(useParams().workoutId)
  const navegar = useNavigate()
  const { descansoPadraoSeg, agenda } = useConfig()

  const dados = useLiveQuery(async () => {
    const treino = await db.workouts.get(workoutId)
    const wes = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('ordem')
    const exercicios = await Promise.all(wes.map((we) => db.exercises.get(we.exerciseId)))
    return { treino, wes, exercicios }
  }, [workoutId])

  if (!dados?.treino) return null
  const { treino, wes, exercicios } = dados

  async function adicionar() {
    const exerciseId = await db.exercises.add({
      nome: 'Novo exercício',
      grupoMuscular: 'peito',
      cues: [],
    } as never)
    await db.workoutExercises.add({
      workoutId,
      exerciseId,
      ordem: wes.length,
      seriesAlvo: 3,
      repsAlvo: '10-12',
      descansoSeg: descansoPadraoSeg,
    } as never)
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const alvo = indice + direcao
    if (alvo < 0 || alvo >= wes.length) return
    await db.transaction('rw', db.workoutExercises, async () => {
      await db.workoutExercises.update(wes[indice].id, { ordem: alvo })
      await db.workoutExercises.update(wes[alvo].id, { ordem: indice })
    })
  }

  async function remover(we: WorkoutExercise) {
    await db.workoutExercises.delete(we.id)
  }

  async function apagarTreino() {
    if (!confirm(`Apagar “${treino.nome}”? O histórico de treinos já feitos continua.`)) return
    await db.transaction('rw', db.workouts, db.workoutExercises, db.settings, async () => {
      await db.workoutExercises.where('workoutId').equals(workoutId).delete()
      await db.workouts.delete(workoutId)
      await db.settings.update(1, { agenda: removerTreino(agenda, workoutId) })
    })
    navegar('/protocolo')
  }

  return (
    <>
      <Cabecalho voltar sobre="Editar treino" titulo={treino.nome} />

      <div className="space-y-4 px-5">
        <label className="block">
          <span className="eyebrow">Nome do treino</span>
          <input
            value={treino.nome}
            onChange={(e) => db.workouts.update(workoutId, { nome: e.target.value })}
            className="mt-2 w-full border-2 border-line bg-surface px-4 py-3 outline-none focus:border-signal"
          />
        </label>

        <ul className="space-y-3">
          {wes.map((we, i) => (
            <ItemEditavel
              key={we.id}
              we={we}
              exercicio={exercicios[i]}
              podeSubir={i > 0}
              podeDescer={i < wes.length - 1}
              aoMover={(d) => mover(i, d)}
              aoRemover={() => remover(we)}
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={adicionar}
          className="stencil w-full border-2 border-dashed border-line-strong py-4 text-lg text-mute active:bg-surface"
        >
          + Adicionar exercício
        </button>

        <button
          type="button"
          onClick={apagarTreino}
          className="eyebrow w-full py-3 text-signal active:text-white"
        >
          Apagar treino
        </button>
      </div>
    </>
  )
}

interface ItemProps {
  we: WorkoutExercise
  exercicio?: Exercise
  podeSubir: boolean
  podeDescer: boolean
  aoMover: (direcao: -1 | 1) => void
  aoRemover: () => void
}

function ItemEditavel({ we, exercicio, podeSubir, podeDescer, aoMover, aoRemover }: ItemProps) {
  if (!exercicio) return null

  return (
    <li className="border-2 border-line bg-surface p-4">
      <input
        value={exercicio.nome}
        onChange={(e) => db.exercises.update(exercicio.id, { nome: e.target.value })}
        className="w-full bg-transparent font-semibold outline-none focus:text-signal"
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <CampoNumero
          rotulo="Séries"
          valor={we.seriesAlvo}
          aoMudar={(v) => db.workoutExercises.update(we.id, { seriesAlvo: v })}
        />
        <label className="block">
          <span className="eyebrow text-[0.5625rem]">Reps</span>
          <input
            value={we.repsAlvo}
            onChange={(e) => db.workoutExercises.update(we.id, { repsAlvo: e.target.value })}
            className="num mt-1 w-full border-2 border-line bg-surface-2 px-2 py-2 text-center outline-none focus:border-signal"
          />
        </label>
        <CampoNumero
          rotulo="Descanso s"
          valor={we.descansoSeg}
          aoMudar={(v) => db.workoutExercises.update(we.id, { descansoSeg: v })}
        />
      </div>

      <textarea
        value={exercicio.cues.join('\n')}
        onChange={(e) =>
          db.exercises.update(exercicio.id, {
            cues: e.target.value.split('\n').filter((linha) => linha.trim() !== ''),
          })
        }
        rows={3}
        placeholder="Pontos de execução, um por linha"
        className="mt-3 w-full resize-none border-2 border-line bg-surface-2 px-3 py-2 text-[0.8125rem] outline-none placeholder:text-line-strong focus:border-signal"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => aoMover(-1)}
          disabled={!podeSubir}
          aria-label="Mover para cima"
          className="h-10 w-10 border-2 border-line text-mute disabled:opacity-30 active:bg-surface-2"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => aoMover(1)}
          disabled={!podeDescer}
          aria-label="Mover para baixo"
          className="h-10 w-10 border-2 border-line text-mute disabled:opacity-30 active:bg-surface-2"
        >
          ↓
        </button>
        <button type="button" onClick={aoRemover} className="eyebrow ml-auto px-2 py-2 active:text-signal">
          Remover
        </button>
      </div>
    </li>
  )
}

function CampoNumero({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string
  valor: number
  aoMudar: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="eyebrow text-[0.5625rem]">{rotulo}</span>
      <input
        type="number"
        inputMode="numeric"
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="num mt-1 w-full border-2 border-line bg-surface-2 px-2 py-2 text-center outline-none focus:border-signal"
      />
    </label>
  )
}
