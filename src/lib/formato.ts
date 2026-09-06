import type { Settings } from '../db/schema'

type Unidade = Settings['unidade']

/** Número em pt-BR sem casa decimal sobrando: 60 e não "60,0". */
function numero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

/** Uma carga com a unidade escolhida nos ajustes. */
export function formatarCarga(valor: number, unidade: Unidade): string {
  return `${numero(valor)} ${unidade}`
}

/**
 * Volume acumulado. Passa de mil, compacta — em toneladas para kg, em "mil lb"
 * para libras, já que tonelada métrica não diz nada para quem treina em lb.
 */
export function formatarVolume(valor: number, unidade: Unidade): string {
  // Arredonda antes de escolher a faixa: 999,6 vira 1000 e deve aparecer
  // compacto, não como "1.000 kg".
  const cheio = Math.round(valor)
  if (cheio >= 1000) {
    const compacto = numero(cheio / 1000)
    return unidade === 'kg' ? `${compacto} t` : `${compacto} mil lb`
  }
  return `${numero(cheio, 0)} ${unidade}`
}
