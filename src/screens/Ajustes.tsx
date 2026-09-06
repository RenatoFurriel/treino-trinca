import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cabecalho } from '../components/Cabecalho'
import { db, SETTINGS_PADRAO } from '../db/schema'
import { baixarBackup, exportar, importar } from '../lib/backup'

export function Ajustes() {
  const config = useLiveQuery(() => db.settings.get(1))
  const inputArquivo = useRef<HTMLInputElement>(null)
  const [recado, setRecado] = useState<string | null>(null)

  if (!config) return null

  async function aoImportar(arquivo: File) {
    try {
      await importar(JSON.parse(await arquivo.text()))
      setRecado('Backup restaurado.')
    } catch (erro) {
      setRecado(erro instanceof Error ? erro.message : 'Não consegui ler esse arquivo.')
    }
  }

  return (
    <>
      <Cabecalho sobre="Como o app se comporta" titulo="Ajustes" />

      <div className="space-y-4 px-5">
        <section className="divide-y-2 divide-line border-2 border-line bg-surface">
          <Escolha
            rotulo="Unidade"
            opcoes={[
              ['kg', 'kg'],
              ['lb', 'lb'],
            ]}
            valor={config.unidade}
            aoMudar={(v) => db.settings.update(1, { unidade: v as 'kg' | 'lb' })}
          />
          <label className="flex items-center justify-between gap-4 px-4 py-4">
            <span className="text-sm">
              Descanso de exercício novo
              <span className="eyebrow mt-0.5 block text-[0.5625rem]">usado ao adicionar exercício</span>
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={config.descansoPadraoSeg}
                onChange={(e) => db.settings.update(1, { descansoPadraoSeg: Number(e.target.value) })}
                className="num w-20 border-2 border-line bg-surface-2 px-2 py-2 text-center outline-none focus:border-signal"
              />
              <span className="eyebrow text-[0.625rem]">seg</span>
            </span>
          </label>
          <Interruptor
            rotulo="Vibrar ao fim do descanso"
            ativo={config.vibrar}
            aoMudar={(v) => db.settings.update(1, { vibrar: v })}
          />
          <Interruptor
            rotulo="Manter tela acesa no treino"
            ativo={config.manterTelaAcesa}
            aoMudar={(v) => db.settings.update(1, { manterTelaAcesa: v })}
          />
        </section>

        <Link
          to="/agenda"
          className="flex items-center justify-between border-2 border-line bg-surface px-4 py-4 text-sm active:bg-surface-2"
        >
          Agenda da semana <span className="text-mute">→</span>
        </Link>

        <section className="border-2 border-line bg-surface p-5">
          <p className="eyebrow">Backup</p>
          <p className="mt-2 text-[0.8125rem] text-mute">
            Tudo fica só neste aparelho. Limpar os dados do navegador apaga o histórico — exporte de
            vez em quando.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={async () => baixarBackup(await exportar())}
              className="stencil flex-1 border-2 border-line-strong py-3.5 text-base active:bg-surface-2"
            >
              Exportar
            </button>
            <button
              type="button"
              onClick={() => inputArquivo.current?.click()}
              className="stencil flex-1 border-2 border-line-strong py-3.5 text-base active:bg-surface-2"
            >
              Importar
            </button>
          </div>
          <input
            ref={inputArquivo}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              if (arquivo) void aoImportar(arquivo)
              e.target.value = ''
            }}
          />
          {recado && <p className="mt-3 text-[0.8125rem] text-done">{recado}</p>}
        </section>

        <button
          type="button"
          onClick={async () => {
            if (!confirm('Apagar TODO o histórico e voltar ao protocolo inicial? Não dá para desfazer.')) return
            await db.transaction('rw', db.tables, async () => {
              await Promise.all(db.tables.map((t) => t.clear()))
              await db.settings.put(SETTINGS_PADRAO)
            })
            location.reload()
          }}
          className="eyebrow w-full py-4 text-signal active:text-white"
        >
          Zerar o app
        </button>
      </div>
    </>
  )
}

function Interruptor({
  rotulo,
  ativo,
  aoMudar,
}: {
  rotulo: string
  ativo: boolean
  aoMudar: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      onClick={() => aoMudar(!ativo)}
      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm"
    >
      {rotulo}
      <span
        className={`flex h-7 w-12 shrink-0 items-center border-2 p-0.5 transition-colors ${
          ativo ? 'border-done bg-done/20' : 'border-line-strong'
        }`}
      >
        <span
          className={`h-full w-5 transition-transform ${
            ativo ? 'translate-x-5 bg-done' : 'bg-line-strong'
          }`}
        />
      </span>
    </button>
  )
}

function Escolha({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string
  opcoes: [string, string][]
  valor: string
  aoMudar: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <span className="text-sm">{rotulo}</span>
      <span className="flex border-2 border-line-strong">
        {opcoes.map(([v, r]) => (
          <button
            key={v}
            type="button"
            onClick={() => aoMudar(v)}
            className={`num px-4 py-1.5 text-sm ${valor === v ? 'bg-done text-ink' : 'text-mute'}`}
          >
            {r}
          </button>
        ))}
      </span>
    </div>
  )
}
