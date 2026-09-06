import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apagarSerie, finalizarSessao, registrarSerie, ultimasSeries } from '../db/queries'
import { db, type Exercise, type SetLog, type WorkoutExercise } from '../db/schema'
import { formatarSegundos, useRestTimer } from '../lib/restTimer'
import { useWakeLock } from '../lib/wakeLock'
import { volume } from '../lib/metrics'
import { formatarVolume } from '../lib/formato'

interface ItemDoTreino {
  we: WorkoutExercise
  exercicio: Exercise
  anteriores: SetLog[]
}

export function Sessao() {
  const { sessionId: parametro } = useParams()
  const sessionId = Number(parametro)
  const navegar = useNavigate()
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null)
  const [finalizando, setFinalizando] = useState(false)

  const dados = useLiveQuery(async () => {
    const sessao = await db.sessions.get(sessionId)
    if (!sessao) return null

    const config = await db.settings.get(1)
    const treino = await db.workouts.get(sessao.workoutId)
    const wes = await db.workoutExercises.where('workoutId').equals(sessao.workoutId).sortBy('ordem')

    const itens: ItemDoTreino[] = []
    for (const we of wes) {
      const exercicio = await db.exercises.get(we.exerciseId)
      if (!exercicio) continue
      itens.push({ we, exercicio, anteriores: await ultimasSeries(we.id, { ignorarSessionId: sessionId }) })
    }

    const logs = await db.setLogs.where('sessionId').equals(sessionId).toArray()
    return { sessao, treino, itens, logs, config }
  }, [sessionId])

  const descanso = useRestTimer({ vibrar: dados?.config?.vibrar !== false })
  useWakeLock(dados?.config?.manterTelaAcesa !== false)

  // Abre no primeiro exercício que ainda tem série pendente.
  useEffect(() => {
    if (!dados || indiceAberto !== null) return
    const pendente = dados.itens.findIndex(
      (item) => dados.logs.filter((l) => l.workoutExerciseId === item.we.id).length < item.we.seriesAlvo,
    )
    setIndiceAberto(pendente === -1 ? 0 : pendente)
  }, [dados, indiceAberto])

  if (dados === undefined) return null
  if (dados === null) {
    return (
      <div className="p-8 text-center text-mute">
        Sessão não encontrada. <Link to="/" className="text-signal underline">Voltar</Link>
      </div>
    )
  }

  const { sessao, treino, itens, logs } = dados
  const unidade = dados.config?.unidade ?? 'kg'
  const totalAlvo = itens.reduce((t, i) => t + i.we.seriesAlvo, 0)
  const feitas = logs.length
  const progresso = totalAlvo === 0 ? 0 : Math.min(1, feitas / totalAlvo)

  async function concluir() {
    await finalizarSessao(sessionId)
    navegar('/', { replace: true })
  }

  return (
    <div className="relative z-1 mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-ink/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.875rem)] pb-3">
          <button
            type="button"
            onClick={() => navegar('/')}
            aria-label="Sair sem finalizar"
            className="-ml-1 p-2 text-mute active:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{treino?.nome ?? 'Treino'}</p>
            <p className="num text-[0.6875rem] text-mute">
              {feitas}/{totalAlvo} séries · {formatarVolume(volume(logs), unidade)} de volume
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFinalizando(true)}
            className="eyebrow border-2 border-line-strong px-3 py-2 active:bg-surface-2"
          >
            Finalizar
          </button>
        </div>
        <div className="h-1 bg-surface-2">
          <div
            className="h-full bg-done transition-[width] duration-300"
            style={{ width: `${progresso * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4" style={{ paddingBottom: descanso.ativo ? '9rem' : '2rem' }}>
        {itens.map((item, indice) => (
          <CartaoDoExercicio
            key={item.we.id}
            item={item}
            indice={indice}
            aberto={indiceAberto === indice}
            aoAbrir={() => setIndiceAberto(indiceAberto === indice ? null : indice)}
            sessionId={sessionId}
            logs={logs.filter((l) => l.workoutExerciseId === item.we.id)}
            unidade={unidade}
            aoRegistrar={() => descanso.iniciar(item.we.descansoSeg)}
            aoConcluirExercicio={() => setIndiceAberto(indice + 1 < itens.length ? indice + 1 : null)}
          />
        ))}
      </main>

      {descanso.ativo && <BarraDeDescanso descanso={descanso} />}

      {finalizando && (
        <DialogoFinalizar
          feitas={feitas}
          totalAlvo={totalAlvo}
          duracaoMin={Math.round((Date.now() - sessao.iniciadaEm) / 60000)}
          aoCancelar={() => setFinalizando(false)}
          aoConfirmar={concluir}
        />
      )}
    </div>
  )
}

interface CartaoProps {
  item: ItemDoTreino
  indice: number
  aberto: boolean
  aoAbrir: () => void
  sessionId: number
  logs: SetLog[]
  unidade: string
  aoRegistrar: () => void
  aoConcluirExercicio: () => void
}

function CartaoDoExercicio({
  item,
  indice,
  aberto,
  aoAbrir,
  sessionId,
  logs,
  unidade,
  aoRegistrar,
  aoConcluirExercicio,
}: CartaoProps) {
  const { we, exercicio, anteriores } = item
  const completo = logs.length >= we.seriesAlvo

  return (
    <section
      className={`border-2 transition-colors ${
        aberto ? 'border-line-strong bg-surface' : completo ? 'border-line bg-surface/40' : 'border-line bg-surface/70'
      }`}
    >
      <button
        type="button"
        onClick={aoAbrir}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span
          className={`num flex h-9 w-9 shrink-0 items-center justify-center border-2 text-sm ${
            completo ? 'border-done bg-done text-ink' : 'border-line-strong text-mute'
          }`}
        >
          {completo ? '✓' : String(indice + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-semibold ${completo ? 'text-mute line-through' : ''}`}>
            {exercicio.nome}
          </span>
          <span className="num block text-[0.6875rem] text-mute">
            {we.seriesAlvo}×{we.repsAlvo}
            {we.tecnica ? ` · ${we.tecnica}` : ''} · {logs.length}/{we.seriesAlvo} feitas
          </span>
        </span>
      </button>

      {aberto && (
        <div className="border-t-2 border-line px-4 pt-4 pb-5">
          {exercicio.mediaUrl && (
            <img
              src={exercicio.mediaUrl}
              alt={`Execução de ${exercicio.nome}`}
              loading="lazy"
              className="mb-4 max-h-56 w-full border-2 border-line bg-surface-2 object-contain"
            />
          )}

          {exercicio.cues.length > 0 && (
            <ul className="mb-4 space-y-1">
              {exercicio.cues.map((cue) => (
                <li key={cue} className="flex gap-2 text-[0.8125rem] text-mute">
                  <span className="text-signal">—</span>
                  {cue}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            {Array.from({ length: we.seriesAlvo }, (_, i) => (
              <LinhaDeSerie
                key={i}
                indiceSerie={i}
                sessionId={sessionId}
                workoutExerciseId={we.id}
                registrada={logs.find((l) => l.indiceSerie === i)}
                anterior={anteriores.find((a) => a.indiceSerie === i) ?? anteriores.at(-1)}
                unidade={unidade}
                aoRegistrar={() => {
                  aoRegistrar()
                  if (logs.length + 1 >= we.seriesAlvo) aoConcluirExercicio()
                }}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link to={`/exercicio/${we.id}`} className="eyebrow active:text-white">
              Ver exercício →
            </Link>
            <span className="num text-[0.6875rem] text-mute">descanso {we.descansoSeg}s</span>
          </div>
        </div>
      )}
    </section>
  )
}

interface LinhaProps {
  indiceSerie: number
  sessionId: number
  workoutExerciseId: number
  registrada?: SetLog
  anterior?: SetLog
  unidade: string
  aoRegistrar: () => void
}

function LinhaDeSerie({
  indiceSerie,
  sessionId,
  workoutExerciseId,
  registrada,
  anterior,
  unidade,
  aoRegistrar,
}: LinhaProps) {
  const [carga, setCarga] = useState('')
  const [reps, setReps] = useState('')

  // A série gravada manda; enquanto não existir, o campo fica vazio e a última
  // vez aparece só como sugestão no placeholder.
  const cargaExibida = registrada ? String(registrada.carga) : carga
  const repsExibidas = registrada ? String(registrada.reps) : reps

  async function alternar() {
    if (registrada) {
      await apagarSerie(sessionId, workoutExerciseId, indiceSerie)
      setCarga(String(registrada.carga))
      setReps(String(registrada.reps))
      return
    }
    await registrarSerie({
      sessionId,
      workoutExerciseId,
      indiceSerie,
      carga: Number(carga || anterior?.carga || 0),
      reps: Number(reps || anterior?.reps || 0),
    })
    aoRegistrar()
  }

  return (
    <div
      className={`flex items-center gap-2 border-2 p-2 ${
        registrada ? 'border-done/45 bg-done/8' : 'border-line bg-surface-2'
      }`}
    >
      <span className="num w-7 shrink-0 text-center text-xs text-mute">{indiceSerie + 1}</span>

      <label className="flex min-w-0 flex-1 items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={cargaExibida}
          onChange={(e) => setCarga(e.target.value)}
          placeholder={anterior ? String(anterior.carga) : '0'}
          aria-label={`Carga da série ${indiceSerie + 1}`}
          className="num w-full min-w-0 bg-transparent py-2 text-xl outline-none placeholder:text-line-strong focus:text-signal"
        />
        <span className="eyebrow shrink-0 text-[0.625rem]">{unidade}</span>
      </label>

      <span className="text-line-strong">×</span>

      <label className="flex min-w-0 flex-1 items-baseline gap-1">
        <input
          type="number"
          inputMode="numeric"
          value={repsExibidas}
          onChange={(e) => setReps(e.target.value)}
          placeholder={anterior ? String(anterior.reps) : '0'}
          aria-label={`Repetições da série ${indiceSerie + 1}`}
          className="num w-full min-w-0 bg-transparent py-2 text-xl outline-none placeholder:text-line-strong focus:text-signal"
        />
        <span className="eyebrow shrink-0 text-[0.625rem]">reps</span>
      </label>

      <button
        type="button"
        onClick={alternar}
        aria-label={registrada ? `Desfazer série ${indiceSerie + 1}` : `Concluir série ${indiceSerie + 1}`}
        aria-pressed={registrada !== undefined}
        className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 transition-transform active:scale-90 ${
          registrada ? 'border-done bg-done text-ink' : 'border-line-strong text-mute'
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 12 5.5 5.5L20 7" />
        </svg>
      </button>
    </div>
  )
}

function BarraDeDescanso({ descanso }: { descanso: ReturnType<typeof useRestTimer> }) {
  const acabou = descanso.restante === 0
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t-2 border-line bg-ink/97 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={`eyebrow ${acabou ? 'text-done' : ''}`}>
            {acabou ? 'Descanso completo — vai' : 'Descanso'}
          </p>
          <p className={`stencil text-5xl tabular-nums ${acabou ? 'text-done' : 'text-white'}`}>
            {formatarSegundos(descanso.restante)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => descanso.ajustar(30)}
          className="num h-12 w-14 shrink-0 border-2 border-line-strong text-sm active:bg-surface-2"
        >
          +30
        </button>
        <button
          type="button"
          onClick={descanso.parar}
          className="stencil h-12 shrink-0 bg-signal px-5 text-lg text-ink active:scale-95"
        >
          Pular
        </button>
      </div>
    </div>
  )
}

interface DialogoProps {
  feitas: number
  totalAlvo: number
  duracaoMin: number
  aoCancelar: () => void
  aoConfirmar: () => void
}

function DialogoFinalizar({ feitas, totalAlvo, duracaoMin, aoCancelar, aoConfirmar }: DialogoProps) {
  const incompleto = feitas < totalAlvo
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-ink/80 backdrop-blur-sm" onClick={aoCancelar}>
      <div
        className="rise mx-auto w-full max-w-lg border-t-2 border-line-strong bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">Finalizar treino</p>
        <p className="stencil mt-2 text-3xl">
          {feitas} de {totalAlvo} séries
        </p>
        <p className="mt-2 text-sm text-mute">
          {duracaoMin} min de treino.
          {incompleto ? ' Ainda faltam séries — quer finalizar assim mesmo?' : ' Treino completo.'}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={aoCancelar}
            className="stencil flex-1 border-2 border-line-strong py-4 text-lg active:bg-surface-2"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            className="stencil flex-1 bg-done py-4 text-lg text-ink active:scale-[0.97]"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  )
}
