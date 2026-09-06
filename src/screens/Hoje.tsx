import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { Cabecalho } from '../components/Cabecalho'
import { iniciarSessao, sessaoEmAndamento } from '../db/queries'
import { db } from '../db/schema'
import { aderenciaDaSemana, inicioDaSemana } from '../lib/metrics'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Hoje() {
  const navegar = useNavigate()
  const hoje = new Date()

  const dados = useLiveQuery(async () => {
    const agenda = await db.schedule.toArray()
    const workouts = await db.workouts.orderBy('ordem').toArray()
    const inicio = inicioDaSemana(hoje).getTime()
    const sessoesDaSemana = await db.sessions.where('iniciadaEm').aboveOrEqual(inicio).toArray()
    const aberta = await sessaoEmAndamento()
    const doDia = agenda.find((d) => d.diaDaSemana === hoje.getDay())
    const treinoDeHoje = doDia?.workoutId
      ? (workouts.find((w) => w.id === doDia.workoutId) ?? null)
      : null

    return {
      agenda,
      workouts,
      treinoDeHoje,
      aberta,
      aderencia: aderenciaDaSemana(sessoesDaSemana, agenda, hoje),
      diasFeitos: new Set(
        sessoesDaSemana
          .filter((s) => s.finalizadaEm !== undefined)
          .map((s) => new Date(s.iniciadaEm).getDay()),
      ),
    }
  }, [])

  if (!dados) return null

  const { treinoDeHoje, aberta, aderencia, agenda, diasFeitos, workouts } = dados

  async function comecar(workoutId: number) {
    const sessionId = await iniciarSessao(workoutId)
    navegar(`/treino/${sessionId}`)
  }

  return (
    <>
      <Cabecalho
        sobre={hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        titulo="Hoje"
      />

      <div className="space-y-4 px-5">
        {aberta && (
          <Link
            to={`/treino/${aberta.id}`}
            className="rise flex items-center justify-between gap-3 border-2 border-signal bg-signal/12 px-5 py-4"
          >
            <div>
              <p className="eyebrow text-signal">Treino em andamento</p>
              <p className="mt-1 font-semibold">
                {workouts.find((w) => w.id === aberta.workoutId)?.nome ?? 'Treino'}
              </p>
            </div>
            <span className="stencil shrink-0 text-signal text-lg">Retomar →</span>
          </Link>
        )}

        <section className="rise border-2 border-line bg-surface" style={{ animationDelay: '40ms' }}>
          <div className="border-b-2 border-line px-5 py-4">
            <p className="eyebrow">Treino do dia</p>
            <p className="stencil mt-2 text-2xl leading-tight">
              {treinoDeHoje ? treinoDeHoje.nome : 'Descanso'}
            </p>
          </div>

          {treinoDeHoje ? (
            <ContagemDeExercicios workoutId={treinoDeHoje.id} />
          ) : (
            <p className="px-5 py-5 text-sm text-mute">
              A agenda não pede treino hoje. Se quiser treinar mesmo assim, escolha um treino no
              Protocolo.
            </p>
          )}

          {treinoDeHoje && !aberta && (
            <button
              type="button"
              onClick={() => comecar(treinoDeHoje.id)}
              className="stencil w-full bg-signal py-5 text-2xl text-ink transition-transform active:scale-[0.985]"
            >
              Iniciar treino
            </button>
          )}
        </section>

        <section className="rise border-2 border-line bg-surface p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Semana</p>
            <p className="num text-sm">
              <span className="text-lg text-done">{aderencia.feitos}</span>
              <span className="text-mute">/{aderencia.planejados} até hoje</span>
            </p>
          </div>

          <ul className="mt-4 flex justify-between gap-1.5">
            {DIAS.map((dia, indice) => {
              const temTreino = agenda.find((d) => d.diaDaSemana === indice)?.workoutId != null
              const feito = diasFeitos.has(indice)
              const eHoje = indice === hoje.getDay()
              return (
                <li key={dia} className="flex-1 text-center">
                  <div
                    className={`flex h-11 items-center justify-center border-2 text-xs font-bold ${
                      feito
                        ? 'border-done bg-done text-ink'
                        : temTreino
                          ? 'border-line-strong text-white'
                          : 'border-line text-mute'
                    } ${eHoje && !feito ? 'border-signal text-signal' : ''}`}
                  >
                    {temTreino ? (feito ? '✓' : '•') : '–'}
                  </div>
                  <span className="eyebrow mt-1.5 block text-[0.5625rem]">{dia}</span>
                </li>
              )
            })}
          </ul>

          <Link to="/agenda" className="eyebrow mt-4 inline-block active:text-white">
            Editar agenda →
          </Link>
        </section>
      </div>
    </>
  )
}

function ContagemDeExercicios({ workoutId }: { workoutId: number }) {
  const itens = useLiveQuery(
    async () => {
      const wes = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('ordem')
      const nomes = await Promise.all(
        wes.map(async (we) => (await db.exercises.get(we.exerciseId))?.nome ?? '—'),
      )
      return { wes, nomes }
    },
    [workoutId],
  )

  if (!itens) return null

  const totalSeries = itens.wes.reduce((t, we) => t + we.seriesAlvo, 0)

  return (
    <div className="px-5 py-4">
      <p className="num text-xs text-mute">
        {itens.wes.length} exercícios · {totalSeries} séries
      </p>
      <ul className="mt-3 space-y-1.5">
        {itens.nomes.map((nome, i) => (
          <li key={itens.wes[i].id} className="flex gap-3 text-sm">
            <span className="num w-5 shrink-0 text-mute">{String(i + 1).padStart(2, '0')}</span>
            <span className="truncate">{nome}</span>
            <span className="num ml-auto shrink-0 text-xs text-mute">
              {itens.wes[i].seriesAlvo}×{itens.wes[i].repsAlvo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
