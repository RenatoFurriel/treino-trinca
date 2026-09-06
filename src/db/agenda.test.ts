import { describe, expect, it } from 'vitest'
import { AGENDA_VAZIA, definirDia, removerTreino, treinoDoDia } from './agenda'

// Domingo é o índice 0 — o dia que quebrava quando a agenda era uma tabela
// com o dia da semana como chave primária.
const semana = [null, 10, null, 11, null, 12, null]

describe('treinoDoDia', () => {
  it('encontra o treino de domingo (índice 0)', () => {
    expect(treinoDoDia([7, 10, null, null, null, null, null], 0)).toBe(7)
  })

  it('devolve null em dia de descanso', () => {
    expect(treinoDoDia(semana, 0)).toBeNull()
    expect(treinoDoDia(semana, 2)).toBeNull()
  })

  it('devolve null para uma agenda malformada, sem quebrar a tela', () => {
    expect(treinoDoDia([], 3)).toBeNull()
    expect(treinoDoDia(undefined, 3)).toBeNull()
  })
})

describe('definirDia', () => {
  it('define o domingo sem tocar nos outros dias', () => {
    expect(definirDia(semana, 0, 99)).toEqual([99, 10, null, 11, null, 12, null])
  })

  it('limpa um dia', () => {
    expect(definirDia(semana, 1, null)).toEqual([null, null, null, 11, null, 12, null])
  })

  it('não muda o array original', () => {
    const original = [...semana]
    definirDia(semana, 0, 99)
    expect(semana).toEqual(original)
  })

  it('ignora dia fora da semana', () => {
    expect(definirDia(semana, 7, 99)).toEqual(semana)
    expect(definirDia(semana, -1, 99)).toEqual(semana)
  })
})

describe('removerTreino', () => {
  it('tira o treino apagado de todos os dias, domingo incluído', () => {
    expect(removerTreino([10, 10, null, 11, null, 10, null], 10)).toEqual([
      null, null, null, 11, null, null, null,
    ])
  })
})

describe('AGENDA_VAZIA', () => {
  it('tem os sete dias em descanso', () => {
    expect(AGENDA_VAZIA).toHaveLength(7)
    expect(AGENDA_VAZIA.every((d) => d === null)).toBe(true)
  })
})
