import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Agenda } from './screens/Agenda'
import { Ajustes } from './screens/Ajustes'
import { Exercicio } from './screens/Exercicio'
import { Hoje } from './screens/Hoje'
import { Protocolo } from './screens/Protocolo'
import { Sessao } from './screens/Sessao'
import { TreinoEditor } from './screens/TreinoEditor'

// Os gráficos carregam sob demanda: o recharts é pesado e não faz falta
// enquanto você está treinando.
const Evolucao = lazy(() =>
  import('./screens/Evolucao').then((m) => ({ default: m.Evolucao })),
)

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Hoje /> },
      { path: '/protocolo', element: <Protocolo /> },
      { path: '/protocolo/:workoutId', element: <TreinoEditor /> },
      { path: '/agenda', element: <Agenda /> },
      {
        path: '/evolucao',
        element: (
          <Suspense fallback={null}>
            <Evolucao />
          </Suspense>
        ),
      },
      { path: '/ajustes', element: <Ajustes /> },
      { path: '/exercicio/:workoutExerciseId', element: <Exercicio /> },
    ],
  },
  // A execução é tela cheia: sem tab bar competindo com o polegar.
  { path: '/treino/:sessionId', element: <Sessao /> },
], { basename: import.meta.env.BASE_URL })
