import type { AppData, Course, License } from '../types'
import { isISODate } from './dates'

// License and course records live in localStorage; certificate files are too
// large for it, so they go in IndexedDB keyed by course id.

const DATA_KEY = 'renewready:v1'
const DB_NAME = 'renewready'
const FILE_STORE = 'certificates'

export const EMPTY_DATA: AppData = { licenses: [], courses: [] }

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isString = (v: unknown): v is string => typeof v === 'string'

function isLicense(v: unknown): v is License {
  const l = v as License
  return (
    !!l &&
    isString(l.id) &&
    isString(l.profession) &&
    isString(l.state) &&
    isString(l.number) &&
    isISODate(l.expiresOn) &&
    isNumber(l.cycleMonths) &&
    isNumber(l.totalHours) &&
    Array.isArray(l.requirements) &&
    l.requirements.every((r) => !!r && isString(r.id) && isString(r.topic) && isNumber(r.hours))
  )
}

function isCourse(v: unknown): v is Course {
  const c = v as Course
  return (
    !!c &&
    isString(c.id) &&
    isString(c.title) &&
    isString(c.provider) &&
    isISODate(c.completedOn) &&
    isNumber(c.hours) &&
    isString(c.topic) &&
    Array.isArray(c.licenseIds) &&
    c.licenseIds.every(isString)
  )
}

/** Returns the data if it has the expected shape, otherwise null. */
export function parseData(value: unknown): AppData | null {
  const data = value as AppData
  if (!data || !Array.isArray(data.licenses) || !Array.isArray(data.courses)) return null
  if (!data.licenses.every(isLicense) || !data.courses.every(isCourse)) return null
  return { licenses: data.licenses, courses: data.courses }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    return (raw && parseData(JSON.parse(raw))) || EMPTY_DATA
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

let dbPromise: Promise<IDBDatabase> | undefined

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(FILE_STORE, mode).objectStore(FILE_STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const putFile = (courseId: string, file: Blob) => withStore('readwrite', (s) => s.put(file, courseId))
export const getFile = (courseId: string) => withStore<Blob | undefined>('readonly', (s) => s.get(courseId))
export const deleteFile = (courseId: string) => withStore('readwrite', (s) => s.delete(courseId))

interface Backup extends AppData {
  app: 'renewready'
  version: 1
  exportedAt: string
  /** Certificate files as data URLs, keyed by course id. */
  files: Record<string, string>
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export async function createBackup(data: AppData): Promise<Blob> {
  const files: Record<string, string> = {}
  for (const course of data.courses) {
    if (!course.certificate) continue
    const file = await getFile(course.id)
    if (file) files[course.id] = await blobToDataUrl(file)
  }
  const backup: Backup = { app: 'renewready', version: 1, exportedAt: new Date().toISOString(), ...data, files }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

/** Restores a backup file, replacing certificate files for the courses it contains. */
export async function restoreBackup(file: File): Promise<AppData> {
  const backup = JSON.parse(await file.text()) as Partial<Backup>
  const data = parseData(backup)
  if (!data) throw new Error('This file is not a RenewReady backup.')
  for (const [courseId, dataUrl] of Object.entries(backup.files ?? {})) {
    const blob = await (await fetch(dataUrl)).blob()
    await putFile(courseId, blob)
  }
  return data
}
