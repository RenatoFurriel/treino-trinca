import { Cabecalho } from '../components/Cabecalho'
import { definirDia } from '../db/agenda'
import { db } from '../db/schema'
import { useConfig } from '../db/useConfig'
import { useLiveQuery } from 'dexie-react-hooks'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function Agenda() {
  const { agenda } = useConfig()
  const workouts = useLiveQuery(() => db.workouts.orderBy('ordem').toArray())

  if (!workouts) return null
  const hoje = new Date().getDay()

  function escolher(dia: number, valor: string) {
    const workoutId = valor === '' ? null : Number(valor)
    return db.settings.update(1, { agenda: definirDia(agenda, dia, workoutId) })
  }

  return (
    <>
      <Cabecalho voltar sobre="Que treino em cada dia" titulo="Agenda" />

      <ul className="space-y-2 px-5">
        {DIAS.map((dia, indice) => (
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
              value={agenda[indice] ?? ''}
              onChange={(e) => escolher(indice, e.target.value)}
              className="min-w-0 flex-1 border-2 border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-signal"
            >
              <option value="">Descanso</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nome}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </>
  )
}
