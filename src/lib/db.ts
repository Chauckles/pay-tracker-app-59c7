import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

export interface Shift {
  id: string
  clockIn: number
  clockOut?: number
  note?: string
  breakMinutes: number
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  data: ArrayBuffer
  addedAt: number
  category: 'paystub' | 'contract' | 'tax' | 'other'
}

export interface Settings {
  id: 'settings'
  hourlyRate: number
  overtimeThreshold: number
  overtimeMultiplier: number
  weeklyHoursTarget: number
  reminderClockIn: string | null
  reminderClockOut: string | null
  notificationsEnabled: boolean
}

interface PayTrackerDB extends DBSchema {
  shifts: {
    key: string
    value: Shift
    indexes: { 'by-clockIn': number }
  }
  documents: {
    key: string
    value: Document
    indexes: { 'by-addedAt': number }
  }
  settings: {
    key: 'settings'
    value: Settings
  }
}

let dbInstance: IDBPDatabase<PayTrackerDB> | null = null

export async function getDB(): Promise<IDBPDatabase<PayTrackerDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<PayTrackerDB>('pay-tracker', 1, {
    upgrade(db) {
      const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' })
      shiftStore.createIndex('by-clockIn', 'clockIn')

      const docStore = db.createObjectStore('documents', { keyPath: 'id' })
      docStore.createIndex('by-addedAt', 'addedAt')

      db.createObjectStore('settings', { keyPath: 'id' })
    },
  })
  return dbInstance
}

export async function getSettings(): Promise<Settings> {
  const db = await getDB()
  const s = await db.get('settings', 'settings')
  return s ?? {
    id: 'settings',
    hourlyRate: 17,
    overtimeThreshold: 8,
    overtimeMultiplier: 1.5,
    weeklyHoursTarget: 40,
    reminderClockIn: '08:45',
    reminderClockOut: '17:15',
    notificationsEnabled: false,
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDB()
  await db.put('settings', s)
}

export async function getActiveShift(): Promise<Shift | undefined> {
  const db = await getDB()
  const all = await db.getAll('shifts')
  return all.find(s => !s.clockOut)
}

export async function clockIn(note?: string): Promise<Shift> {
  const db = await getDB()
  const existing = await getActiveShift()
  if (existing) throw new Error('Already clocked in')
  const shift: Shift = {
    id: crypto.randomUUID(),
    clockIn: Date.now(),
    note,
    breakMinutes: 0,
  }
  await db.put('shifts', shift)
  return shift
}

export async function clockOut(): Promise<Shift> {
  const db = await getDB()
  const active = await getActiveShift()
  if (!active) throw new Error('Not clocked in')
  const updated: Shift = { ...active, clockOut: Date.now() }
  await db.put('shifts', updated)
  return updated
}

export async function getShiftsByRange(start: number, end: number): Promise<Shift[]> {
  const db = await getDB()
  const index = db.transaction('shifts').store.index('by-clockIn')
  return index.getAll(IDBKeyRange.bound(start, end))
}

export async function getAllShifts(): Promise<Shift[]> {
  const db = await getDB()
  return db.getAll('shifts')
}

export async function deleteShift(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('shifts', id)
}

export async function updateShift(shift: Shift): Promise<void> {
  const db = await getDB()
  await db.put('shifts', shift)
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDB()
  return db.getAll('documents')
}

export async function saveDocument(doc: Omit<Document, 'id' | 'addedAt'>): Promise<Document> {
  const db = await getDB()
  const full: Document = {
    ...doc,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  }
  await db.put('documents', full)
  return full
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('documents', id)
}
