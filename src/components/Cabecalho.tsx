import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  sobre?: string
  titulo: string
  acao?: ReactNode
  voltar?: boolean
}

export function Cabecalho({ sobre, titulo, acao, voltar }: Props) {
  const navegar = useNavigate()

  return (
    <header className="px-5 pt-[calc(env(safe-area-inset-top)+1.75rem)] pb-6">
      {voltar && (
        <button
          type="button"
          onClick={() => navegar(-1)}
          className="eyebrow mb-4 -ml-1 flex items-center gap-1.5 py-1 active:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 5-7 7 7 7" />
          </svg>
          Voltar
        </button>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {sobre && <p className="eyebrow mb-1.5">{sobre}</p>}
          <h1 className="stencil text-4xl">{titulo}</h1>
        </div>
        {acao}
      </div>
    </header>
  )
}
