import Dexie, { type EntityTable } from 'dexie'

/** Grupos usados para agregar volume semanal na tela de Evolução. */
export type GrupoMuscular =
  | 'peito'
  | 'costas'
  | 'ombro'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posterior'
  | 'gluteo'
  | 'panturrilha'
  | 'core'
  | 'cardio'

export interface Exercise {
  id: number
  nome: string
  grupoMuscular: GrupoMuscular
  equipamento?: string
  /** Pontos de execução, curtos — lidos de relance entre as séries. */
  cues: string[]
  /** Referência visual online. */
  mediaUrl?: string
  /** Referência visual guardada no aparelho, para funcionar offline. */
  mediaBlobId?: number
  obs?: string
}

/** O molde: um treino do protocolo (Treino A, B, C...). */
export interface Workout {
  id: number
  nome: string
  ordem: number
  obs?: string
}

/** Um exercício dentro de um treino, com os alvos prescritos. */
export interface WorkoutExercise {
  id: number
  workoutId: number
  exerciseId: number
  ordem: number
  seriesAlvo: number
  /** Faixa como está no protocolo: "8-12", "10", "até a falha". */
  repsAlvo: string
  cargaAlvo?: number
  descansoSeg: number
  /** Bi-set, drop-set, rest-pause... como está escrito no protocolo. */
  tecnica?: string
  obs?: string
}

/** O histórico: uma execução real de um treino. */
export interface Session {
  id: number
  workoutId: number
  iniciadaEm: number
  finalizadaEm?: number
  /** 1 a 5, preenchido ao finalizar. */
  sensacao?: number
  obs?: string
}

export interface SetLog {
  id: number
  sessionId: number
  workoutExerciseId: number
  indiceSerie: number
  reps: number
  carga: number
  rpe?: number
  feitaEm: number
}

/** diaDaSemana: 0 = domingo. workoutId nulo = descanso. */
export interface ScheduleEntry {
  diaDaSemana: number
  workoutId: number | null
}

export interface Settings {
  id: 1
  unidade: 'kg' | 'lb'
  descansoPadraoSeg: number
  vibrar: boolean
  manterTelaAcesa: boolean
}

export interface MediaBlob {
  id: number
  blob: Blob
}

export const SETTINGS_PADRAO: Settings = {
  id: 1,
  unidade: 'kg',
  descansoPadraoSeg: 50,
  vibrar: true,
  manterTelaAcesa: true,
}

export class TreinoDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  schedule!: EntityTable<ScheduleEntry, 'diaDaSemana'>
  settings!: EntityTable<Settings, 'id'>
  mediaBlobs!: EntityTable<MediaBlob, 'id'>

  constructor(nome = 'treino') {
    super(nome)
    this.version(1).stores({
      exercises: '++id, nome, grupoMuscular',
      workouts: '++id, ordem',
      workoutExercises: '++id, workoutId, exerciseId, [workoutId+ordem]',
      sessions: '++id, workoutId, iniciadaEm, finalizadaEm',
      setLogs: '++id, sessionId, workoutExerciseId, feitaEm',
      schedule: 'diaDaSemana',
      settings: 'id',
      mediaBlobs: '++id',
    })
  }
}

export const db = new TreinoDB()
