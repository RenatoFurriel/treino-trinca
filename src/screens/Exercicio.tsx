import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { Cabecalho } from '../components/Cabecalho'
import { db } from '../db/schema'
import { cargaMaxima, volume } from '../lib/metrics'
import { formatarCarga, formatarVolume } from '../lib/formato'
import { useConfig } from '../db/useConfig'

export function Exercicio() {
  const workoutExerciseId = Number(useParams().workoutExerciseId)
  const { unidade } = useConfig()

  const dados = useLiveQuery(async () => {
    const we = await db.workoutExercises.get(workoutExerciseId)
    if (!we) return null
    const exercicio = await db.exercises.get(we.exerciseId)
    const logs = await db.setLogs.where('workoutExerciseId').equals(workoutExerciseId).toArray()

    const porSessao = new Map<number, typeof logs>()
    for (const log of logs) {
      porSessao.set(log.sessionId, [...(porSessao.get(log.sessionId) ?? []), log])
    }

    const historico = await Promise.all(
      [...porSessao.entries()]
        .sort((a, b) => b[0] - a[0])
        .slice(0, 12)
        .map(async ([sessionId, series]) => ({
          sessionId,
          data: (await db.sessions.get(sessionId))?.iniciadaEm ?? 0,
          series: series.sort((a, b) => a.indiceSerie - b.indiceSerie),
        })),
    )

    return { we, exercicio, historico, recorde: cargaMaxima(logs) }
  }, [workoutExerciseId])

  if (!dados?.exercicio) return null
  const { we, exercicio, historico, recorde } = dados

  const buscaNoYouTube = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${exercicio.nome} execução correta`,
  )}`

  return (
    <>
      <Cabecalho voltar sobre={exercicio.grupoMuscular} titulo={exercicio.nome} />

      <div className="space-y-4 px-5">
        {exercicio.mediaUrl && (
          <img
            src={exercicio.mediaUrl}
            alt={`Execução de ${exercicio.nome}`}
            className="w-full border-2 border-line bg-surface object-cover"
          />
        )}

        <section className="border-2 border-line bg-surface p-5">
          <div className="flex gap-6">
            <div>
              <p className="eyebrow">Prescrição</p>
              <p className="stencil mt-1 text-2xl">
                {we.seriesAlvo}×{we.repsAlvo}
              </p>
            </div>
            <div>
              <p className="eyebrow">Descanso</p>
              <p className="stencil mt-1 text-2xl">{we.descansoSeg}s</p>
            </div>
            {recorde !== null && (
              <div>
                <p className="eyebrow">Recorde</p>
                <p className="stencil mt-1 text-2xl text-done">{formatarCarga(recorde, unidade)}</p>
              </div>
            )}
          </div>
          {we.tecnica && <p className="mt-4 text-sm text-signal">{we.tecnica}</p>}
        </section>

        {exercicio.cues.length > 0 && (
          <section className="border-2 border-line bg-surface p-5">
            <p className="eyebrow">Execução</p>
            <ul className="mt-3 space-y-2">
              {exercicio.cues.map((cue) => (
                <li key={cue} className="flex gap-2.5 text-sm">
                  <span className="text-signal">—</span>
                  {cue}
                </li>
              ))}
            </ul>
          </section>
        )}

        <a
          href={buscaNoYouTube}
          target="_blank"
          rel="noreferrer"
          className="stencil block border-2 border-line-strong py-4 text-center text-lg active:bg-surface-2"
        >
          Ver execução no YouTube ↗
        </a>

        <section>
          <p className="eyebrow mb-3">Histórico</p>
          {historico.length === 0 ? (
            <p className="text-sm text-mute">Você ainda não registrou esse exercício.</p>
          ) : (
            <ul className="space-y-2">
              {historico.map((sessao) => (
                <li key={sessao.sessionId} className="border-2 border-line bg-surface px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="num text-xs text-mute">
                      {new Date(sessao.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <span className="num text-[0.6875rem] text-mute">
                      vol {formatarVolume(volume(sessao.series), unidade)}
                    </span>
                  </div>
                  <p className="num mt-1.5 text-sm">
                    {sessao.series.map((s) => `${s.carga}×${s.reps}`).join('  ·  ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
