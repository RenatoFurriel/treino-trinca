import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { Cabecalho } from '../components/Cabecalho'
import { iniciarSessao } from '../db/queries'
import { db } from '../db/schema'

export function Protocolo() {
  const navegar = useNavigate()

  const treinos = useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('ordem').toArray()
    return Promise.all(
      workouts.map(async (w) => {
        const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
        return {
          ...w,
          exercicios: wes.length,
          series: wes.reduce((t, we) => t + we.seriesAlvo, 0),
        }
      }),
    )
  }, [])

  async function comecar(workoutId: number) {
    navegar(`/treino/${await iniciarSessao(workoutId)}`)
  }

  async function novoTreino() {
    const ordem = (await db.workouts.count()) + 1
    const id = await db.workouts.add({ nome: `Treino ${ordem}`, ordem } as never)
    navegar(`/protocolo/${id}`)
  }

  return (
    <>
      <Cabecalho
        sobre="Seus treinos"
        titulo="Protocolo"
        acao={
          <button
            type="button"
            onClick={novoTreino}
            className="stencil shrink-0 border-2 border-line-strong px-3 py-2 text-lg active:bg-surface-2"
          >
            + Novo
          </button>
        }
      />

      <ul className="space-y-3 px-5">
        {treinos?.map((treino, i) => (
          <li
            key={treino.id}
            className="rise border-2 border-line bg-surface"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Link to={`/protocolo/${treino.id}`} className="block px-5 pt-4 pb-3">
              <p className="stencil text-xl leading-tight">{treino.nome}</p>
              <p className="num mt-1.5 text-[0.6875rem] text-mute">
                {treino.exercicios} exercícios · {treino.series} séries
              </p>
            </Link>
            <button
              type="button"
              onClick={() => comecar(treino.id)}
              className="stencil w-full border-t-2 border-line py-3.5 text-lg text-signal active:bg-signal/10"
            >
              Iniciar
            </button>
          </li>
        ))}
      </ul>

      {treinos?.length === 0 && (
        <p className="px-5 text-sm text-mute">Nenhum treino ainda. Toque em “+ Novo” para criar.</p>
      )}
    </>
  )
}
