import { NavLink, Outlet } from 'react-router-dom'

const ABAS = [
  { para: '/', rotulo: 'Hoje', icone: BoltIcon },
  { para: '/protocolo', rotulo: 'Protocolo', icone: ListIcon },
  { para: '/evolucao', rotulo: 'Evolução', icone: ChartIcon },
  { para: '/ajustes', rotulo: 'Ajustes', icone: GearIcon },
]

export function Shell() {
  return (
    <div className="relative z-1 mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-ink/95 backdrop-blur-md">
        <ul className="mx-auto flex max-w-lg pb-[env(safe-area-inset-bottom)]">
          {ABAS.map(({ para, rotulo, icone: Icone }) => (
            <li key={para} className="flex-1">
              <NavLink
                to={para}
                end={para === '/'}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-signal' : 'text-mute active:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icone ativo={isActive} />
                    <span className="text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                      {rotulo}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

interface IconeProps {
  ativo?: boolean
}

function BoltIcon({ ativo }: IconeProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={ativo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

function ListIcon({ ativo }: IconeProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 2} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

function ChartIcon({ ativo }: IconeProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 2} strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

function GearIcon({ ativo }: IconeProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.6 : 2}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" strokeLinecap="round" />
    </svg>
  )
}
