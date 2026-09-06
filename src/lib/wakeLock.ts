import { useEffect } from 'react'

/**
 * Mantém a tela acesa durante o treino e a readquire quando o app volta do
 * segundo plano — o navegador solta o lock sozinho ao trocar de aba.
 */
export function useWakeLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelado = false

    const pedir = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // Bateria baixa ou aba em segundo plano: seguir sem manter a tela acesa.
      }
    }

    const aoVoltar = () => {
      if (!cancelado && document.visibilityState === 'visible') void pedir()
    }

    void pedir()
    document.addEventListener('visibilitychange', aoVoltar)

    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', aoVoltar)
      void sentinel?.release()
    }
  }, [ativo])
}
