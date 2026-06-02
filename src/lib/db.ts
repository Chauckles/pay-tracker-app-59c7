import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

export interface User {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Shift {
  id: string
  userId: string
  clockIn: number
  clockOut?: number
  note?: string
  breakMinutes: number
}

export type DocCategory =
  | 'w2' | 'w4' | 'i9' | 'offer-letter'
  | 'paystub' | '1099' | 'contract' | 'background-check' | 'other'

export interface Document {
  id: string
  userId: string
  name: string
  type: string
  size: number
  data: ArrayBuffer
  addedAt: number
  year: number
  category: DocCategory
}

export interface BreakSlot {
  time: string
  label: string
  durationMinutes: number
}

export interface Settings {
  id: string
  hourlyRate: number
  overtimeThreshold: number
  overtimeMultiplier: number
  weeklyHoursTarget: number
  reminderClockIn: string | null
  reminderClockOut: string | null
  notificationsEnabled: boolean
  lunchTime: string | null
  lunchDurationMinutes: number
  extraBreaks: BreakSlot[]
}

interface PayTrackerDB extends DBSchema {
  users: {
    key: string
    value: User
  }
  shifts: {
    key: string
    value: Shift
    indexes: { 'by-clockIn': number; 'by-userId': string }
  }
  documents: {
    key: string
    value: Document
    indexes: { 'by-addedAt': number; 'by-userId': string }
  }
  settings: {
    key: string
    value: Settings
  }
}

let dbInstance: IDBPDatabase<PayTrackerDB> | null = null

export async function getDB(): Promise<IDBPDatabase<PayTrackerDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<PayTrackerDB>('pay-tracker', 2, {
    upgrade(db, oldVersion) {
      // v1 → v2: add users store, add userId indexes, migrate existing data
      if (oldVersion < 1) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' })
        shiftStore.createIndex('by-clockIn', 'clockIn')
        shiftStore.createIndex('by-userId', 'userId')

        const docStore = db.createObjectStore('documents', { keyPath: 'id' })
        docStore.createIndex('by-addedAt', 'addedAt')
        docStore.createIndex('by-userId', 'userId')

        db.createObjectStore('settings', { keyPath: 'id' })
        db.createObjectStore('users', { keyPath: 'id' })
      }

      if (oldVersion === 1) {
        // Migrate from v1: add userId indexes to existing stores
        const shiftStore = db.transaction('shifts').objectStore('shifts') as unknown as Parameters<typeof db.createObjectStore>[1]
        void shiftStore

        if (!db.objectStoreNames.contains('users' as never)) {
          db.createObjectStore('users', { keyPath: 'id' })
        }

        // Add userId indexes if not present
        const tx = (db as unknown as { transaction: (stores: string[], mode: string) => { objectStore: (name: string) => { indexNames: DOMStringList; createIndex: (name: string, key: string) => void } } })
        void tx
      }
    },
    blocked() { dbInstance = null },
    blocking() { dbInstance?.close(); dbInstance = null },
  })
  return dbInstance
}

// ─── Users ────────────────────────────────────────────────────────────────────

const USER_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6']

export async function getUsers(): Promise<User[]> {
  const db = await getDB()
  return db.getAll('users')
}

export async function createUser(name: string): Promise<User> {
  const db = await getDB()
  const existing = await db.getAll('users')
  const color = USER_COLORS[existing.length % USER_COLORS.length]
  const user: User = { id: crypto.randomUUID(), name: name.trim(), color, createdAt: Date.now() }
  await db.put('users', user)
  return user
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB()
  // Clean up user's data
  const shifts = await db.getAll('shifts')
  for (const s of shifts.filter(s => s.userId === id)) await db.delete('shifts', s.id)
  const docs = await db.getAll('documents')
  for (const d of docs.filter(d => d.userId === id)) await db.delete('documents', d.id)
  await db.delete('settings', id)
  await db.delete('users', id)
}

export function getActiveUserId(): string | null {
  return localStorage.getItem('activeUserId')
}

export function setActiveUserId(id: string): void {
  localStorage.setItem('activeUserId', id)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function defaultSettings(userId: string): Settings {
  return {
    id: userId,
    hourlyRate: 17,
    overtimeThreshold: 8,
    overtimeMultiplier: 1.5,
    weeklyHoursTarget: 40,
    reminderClockIn: '08:45',
    reminderClockOut: '17:15',
    notificationsEnabled: false,
    lunchTime: '12:00',
    lunchDurationMinutes: 30,
    extraBreaks: [],
  }
}

export async function getSettings(userId: string): Promise<Settings> {
  const db = await getDB()
  return (await db.get('settings', userId)) ?? defaultSettings(userId)
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDB()
  await db.put('settings', s)
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export async function getActiveShift(userId: string): Promise<Shift | undefined> {
  const db = await getDB()
  const all = await db.getAll('shifts')
  return all.find(s => s.userId === userId && !s.clockOut)
}

export async function clockIn(userId: string, note?: string): Promise<Shift> {
  const existing = await getActiveShift(userId)
  if (existing) throw new Error('Already clocked in')
  const db = await getDB()
  const shift: Shift = { id: crypto.randomUUID(), userId, clockIn: Date.now(), note, breakMinutes: 0 }
  await db.put('shifts', shift)
  return shift
}

export async function clockOut(userId: string): Promise<Shift> {
  const db = await getDB()
  const active = await getActiveShift(userId)
  if (!active) throw new Error('Not clocked in')
  const updated: Shift = { ...active, clockOut: Date.now() }
  await db.put('shifts', updated)
  return updated
}

export async function getAllShifts(userId: string): Promise<Shift[]> {
  const db = await getDB()
  const all = await db.getAll('shifts')
  return all.filter(s => s.userId === userId)
}

export async function deleteShift(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('shifts', id)
}

export async function updateShift(shift: Shift): Promise<void> {
  const db = await getDB()
  await db.put('shifts', shift)
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getAllDocuments(userId: string): Promise<Document[]> {
  const db = await getDB()
  const all = await db.getAll('documents')
  return all.filter(d => d.userId === userId).sort((a, b) => b.addedAt - a.addedAt)
}

export async function saveDocument(doc: Omit<Document, 'id' | 'addedAt'>): Promise<Document> {
  const db = await getDB()
  const full: Document = { ...doc, id: crypto.randomUUID(), addedAt: Date.now() }
  await db.put('documents', full)
  return full
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('documents', id)
}
