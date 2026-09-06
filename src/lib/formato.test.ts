import { describe, expect, it } from 'vitest'
import { formatarCarga, formatarVolume } from './formato'

describe('formatarCarga', () => {
  it('acompanha a unidade escolhida nos ajustes', () => {
    expect(formatarCarga(42.5, 'kg')).toBe('42,5 kg')
    expect(formatarCarga(42.5, 'lb')).toBe('42,5 lb')
  })

  it('não deixa casa decimal sobrando em número redondo', () => {
    expect(formatarCarga(60, 'kg')).toBe('60 kg')
  })
})

describe('formatarVolume', () => {
  it('usa a unidade escolhida', () => {
    expect(formatarVolume(850, 'lb')).toBe('850 lb')
  })

  it('compacta em toneladas a partir de mil quilos', () => {
    expect(formatarVolume(1200, 'kg')).toBe('1,2 t')
    expect(formatarVolume(12500, 'kg')).toBe('12,5 t')
  })

  it('em libras compacta em mil libras, não em toneladas métricas', () => {
    expect(formatarVolume(1200, 'lb')).toBe('1,2 mil lb')
  })

  it('arredonda antes de escolher a faixa, sem cair num "1.000 kg"', () => {
    expect(formatarVolume(999.6, 'kg')).toBe('1 t')
    expect(formatarVolume(940, 'kg')).toBe('940 kg')
  })
})
