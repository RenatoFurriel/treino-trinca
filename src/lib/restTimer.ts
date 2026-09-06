import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Timer de descanso baseado em timestamp, não em contagem de ticks: se o
 * navegador estrangular o timer com a tela apagada, ao voltar o número está
 * certo.
 */
export function useRestTimer(opcoes: { vibrar?: boolean } = {}) {
  const [fimEm, setFimEm] = useState<number | null>(null)
  const [restante, setRestante] = useState(0)
  const jaAvisou = useRef(false)

  useEffect(() => {
    if (fimEm === null) return

    const atualizar = () => {
      const segundos = Math.max(0, Math.ceil((fimEm - Date.now()) / 1000))
      setRestante(segundos)
      if (segundos === 0 && !jaAvisou.current) {
        jaAvisou.current = true
        if (opcoes.vibrar !== false) navigator.vibrate?.([180, 90, 180])
      }
    }

    atualizar()
    const id = window.setInterval(atualizar, 250)
    return () => window.clearInterval(id)
  }, [fimEm, opcoes.vibrar])

  const iniciar = useCallback((segundos: number) => {
    jaAvisou.current = false
    setFimEm(Date.now() + segundos * 1000)
  }, [])

  const parar = useCallback(() => {
    setFimEm(null)
    setRestante(0)
  }, [])

  const ajustar = useCallback((segundos: number) => {
    setFimEm((atual) => (atual === null ? null : Math.max(Date.now(), atual + segundos * 1000)))
  }, [])

  return { ativo: fimEm !== null, restante, iniciar, parar, ajustar }
}

export function formatarSegundos(total: number): string {
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}
