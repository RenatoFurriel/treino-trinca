import { useLiveQuery } from 'dexie-react-hooks'
import { Cabecalho } from '../components/Cabecalho'
import { db } from '../db/schema'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function Agenda() {
  const dados = useLiveQuery(async () => ({
    agenda: await db.schedule.toArray(),
    workouts: await db.workouts.orderBy('ordem').toArray(),
  }))

  if (!dados) return null
  const hoje = new Date().getDay()

  return (
    <>
      <Cabecalho voltar sobre="Que treino em cada dia" titulo="Agenda" />

      <ul className="space-y-2 px-5">
        {DIAS.map((dia, indice) => {
          const atual = dados.agenda.find((d) => d.diaDaSemana === indice)?.workoutId ?? null
          return (
            <li
              key={dia}
              className={`flex items-center gap-3 border-2 bg-surface px-4 py-3 ${
                indice === hoje ? 'border-signal' : 'border-line'
              }`}
            >
              <span className="w-24 shrink-0">
                <span className={`text-sm font-semibold ${indice === hoje ? 'text-signal' : ''}`}>
                  {dia}
                </span>
                {indice === hoje && <span className="eyebrow block text-[0.5625rem]">hoje</span>}
              </span>
              <select
                value={atual ?? ''}
                onChange={(e) =>
                  db.schedule.put({
                    diaDaSemana: indice,
                    workoutId: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="min-w-0 flex-1 border-2 border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-signal"
              >
                <option value="">Descanso</option>
                {dados.workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nome}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>
    </>
  )
}
