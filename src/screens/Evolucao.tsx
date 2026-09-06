import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Cabecalho } from '../components/Cabecalho'
import { db } from '../db/schema'
import { cargaMaxima, inicioDaSemana, volume } from '../lib/metrics'
import { formatarCarga, formatarVolume } from '../lib/formato'
import { useConfig } from '../db/useConfig'

export function Evolucao() {
  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const { unidade } = useConfig()

  const dados = useLiveQuery(async () => {
    const sessoes = (await db.sessions.toArray()).filter((s) => s.finalizadaEm !== undefined)
    const logs = await db.setLogs.toArray()
    const wes = await db.workoutExercises.toArray()
    const exercicios = await db.exercises.toArray()

    // setLogs apontam para workoutExercise; agrupamos por exercício para o
    // histórico seguir o movimento mesmo se ele mudar de treino.
    const exercisePorWe = new Map(wes.map((we) => [we.id, we.exerciseId]))
    const comHistorico = new Set(
      logs.map((l) => exercisePorWe.get(l.workoutExerciseId)).filter((id) => id !== undefined),
    )

    const inicio = inicioDaSemana(new Date()).getTime()
    const daSemana = logs.filter((l) => l.feitaEm >= inicio)

    return {
      sessoes,
      logs,
      exercisePorWe,
      exercicios: exercicios.filter((e) => comHistorico.has(e.id)),
      volumeDaSemana: volume(daSemana),
      totalDeSessoes: sessoes.length,
      volumeTotal: volume(logs),
    }
  }, [])

  if (!dados) return null

  const selecionado = exerciseId ?? dados.exercicios[0]?.id ?? null

  const serie =
    selecionado === null
      ? []
      : (() => {
          const porSessao = new Map<number, typeof dados.logs>()
          for (const log of dados.logs) {
            if (dados.exercisePorWe.get(log.workoutExerciseId) !== selecionado) continue
            porSessao.set(log.sessionId, [...(porSessao.get(log.sessionId) ?? []), log])
          }
          return [...porSessao.entries()]
            .map(([sessionId, series]) => ({
              sessionId,
              data: dados.sessoes.find((s) => s.id === sessionId)?.iniciadaEm ?? 0,
              carga: cargaMaxima(series) ?? 0,
              volume: volume(series),
            }))
            .sort((a, b) => a.data - b.data)
            .map((p) => ({
              ...p,
              rotulo: new Date(p.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            }))
        })()

  return (
    <>
      <Cabecalho sobre="O que os números dizem" titulo="Evolução" />

      <div className="space-y-4 px-5">
        <section className="grid grid-cols-3 gap-2">
          <Indicador rotulo="Treinos" valor={String(dados.totalDeSessoes)} />
          <Indicador rotulo="Vol. semana" valor={formatarVolume(dados.volumeDaSemana, unidade)} destaque />
          <Indicador rotulo="Vol. total" valor={formatarVolume(dados.volumeTotal, unidade)} />
        </section>

        {dados.exercicios.length === 0 ? (
          <p className="border-2 border-line bg-surface p-5 text-sm text-mute">
            Faça e finalize um treino para os gráficos aparecerem aqui.
          </p>
        ) : (
          <section className="border-2 border-line bg-surface p-5">
            <p className="eyebrow">Carga máxima por treino</p>
            <select
              value={selecionado ?? ''}
              onChange={(e) => setExerciseId(Number(e.target.value))}
              className="mt-3 w-full border-2 border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-signal"
            >
              {dados.exercicios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>

            <div className="mt-5 -ml-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 6, right: 10, bottom: 0, left: -14 }}>
                  <CartesianGrid stroke="#2b2b34" vertical={false} />
                  <XAxis
                    dataKey="rotulo"
                    tick={{ fill: '#83838f', fontSize: 11, fontFamily: 'JetBrains Mono Variable' }}
                    axisLine={{ stroke: '#2b2b34' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#83838f', fontSize: 11, fontFamily: 'JetBrains Mono Variable' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1b1b21',
                      border: '2px solid #43434f',
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#83838f' }}
                    formatter={(v) => [formatarCarga(Number(v), unidade), 'Carga máx.']}
                  />
                  <Line
                    type="monotone"
                    dataKey="carga"
                    stroke="#ff3b21"
                    strokeWidth={2.5}
                    dot={{ fill: '#ff3b21', r: 3.5, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#c6f24e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {serie.length > 1 && <Progressao serie={serie} unidade={unidade} />}
          </section>
        )}
      </div>
    </>
  )
}

function Progressao({ serie, unidade }: { serie: { carga: number }[]; unidade: 'kg' | 'lb' }) {
  const primeira = serie[0].carga
  const ultima = serie[serie.length - 1].carga
  const delta = ultima - primeira
  const percentual = primeira === 0 ? 0 : Math.round((delta / primeira) * 100)

  return (
    <p className="num mt-4 text-xs text-mute">
      {delta === 0 ? (
        'Carga estável desde o primeiro registro.'
      ) : (
        <>
          <span className={delta > 0 ? 'text-done' : 'text-signal'}>
            {delta > 0 ? '+' : ''}
            {formatarCarga(delta, unidade)} ({percentual > 0 ? '+' : ''}
            {percentual}%)
          </span>{' '}
          desde o primeiro registro.
        </>
      )}
    </p>
  )
}

function Indicador({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="border-2 border-line bg-surface px-3 py-4 text-center">
      <p className={`stencil text-2xl ${destaque ? 'text-done' : ''}`}>{valor}</p>
      <p className="eyebrow mt-1.5 text-[0.5625rem]">{rotulo}</p>
    </div>
  )
}
