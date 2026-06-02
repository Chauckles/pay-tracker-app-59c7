import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getDB, getSettings, saveSettings,
  getActiveShift, clockIn as dbClockIn, clockOut as dbClockOut,
  getAllShifts, deleteShift, updateShift,
  getAllDocuments, saveDocument, deleteDocument,
  getUsers, createUser, deleteUser, getActiveUserId, setActiveUserId,
} from '../lib/db'
import type { Shift, Settings, Document, User } from '../lib/db'
import {
  getPayStats, getDayRange, getWeekRange, getMonthRange,
  buildWeeklyChartData, shiftDurationMs,
} from '../lib/pay'

export function usePayTracker() {
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserIdState] = useState<string | null>(getActiveUserId())
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | undefined>(undefined)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [tick, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load users on mount
  useEffect(() => {
    async function init() {
      await getDB()
      const allUsers = await getUsers()
      setUsers(allUsers)
    }
    init()
  }, [])

  // Load user-specific data when activeUserId changes
  useEffect(() => {
    if (!activeUserId) { setSettings(null); setShifts([]); setDocuments([]); setActiveShift(undefined); return }
    async function loadUser() {
      const [s, a, all, docs] = await Promise.all([
        getSettings(activeUserId!),
        getActiveShift(activeUserId!),
        getAllShifts(activeUserId!),
        getAllDocuments(activeUserId!),
      ])
      setSettings(s)
      setActiveShift(a)
      setShifts(all)
      setDocuments(docs)
    }
    loadUser()
  }, [activeUserId])

  useEffect(() => {
    if (activeShift) {
      tickRef.current = setInterval(() => setTick(t => t + 1), 1000)
    } else {
      if (tickRef.current) clearInterval(tickRef.current)
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [activeShift?.id])

  const switchUser = useCallback((id: string) => {
    setActiveUserId(id)
    setActiveUserIdState(id)
  }, [])

  const addUser = useCallback(async (name: string) => {
    const user = await createUser(name)
    setUsers(prev => [...prev, user])
    return user
  }, [])

  const removeUser = useCallback(async (id: string) => {
    await deleteUser(id)
    setUsers(prev => prev.filter(u => u.id !== id))
    if (activeUserId === id) {
      const remaining = users.filter(u => u.id !== id)
      if (remaining.length > 0) switchUser(remaining[0].id)
      else { setActiveUserId(''); setActiveUserIdState(null) }
    }
  }, [activeUserId, users, switchUser])

  const clockIn = useCallback(async (note?: string) => {
    if (!activeUserId) return
    const shift = await dbClockIn(activeUserId, note)
    setActiveShift(shift)
    setShifts(prev => [...prev, shift])
  }, [activeUserId])

  const clockOut = useCallback(async () => {
    if (!activeUserId) return
    const shift = await dbClockOut(activeUserId)
    setActiveShift(undefined)
    setShifts(prev => prev.map(s => s.id === shift.id ? shift : s))
  }, [activeUserId])

  const removeShift = useCallback(async (id: string) => {
    await deleteShift(id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }, [])

  const editShift = useCallback(async (shift: Shift) => {
    await updateShift(shift)
    setShifts(prev => prev.map(s => s.id === shift.id ? shift : s))
  }, [])

  const updateSettings = useCallback(async (s: Settings) => {
    await saveSettings(s)
    setSettings(s)
  }, [])

  const addDocument = useCallback(async (doc: Omit<Document, 'id' | 'addedAt'>) => {
    const saved = await saveDocument(doc)
    setDocuments(prev => [saved, ...prev])
    return saved
  }, [])

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }, [])

  const allShiftsWithActive = activeShift
    ? shifts.map(s => s.id === activeShift.id ? { ...activeShift } : s)
    : shifts

  const dayStats = settings ? getPayStats(allShiftsWithActive, settings, getDayRange().start, getDayRange().end) : null
  const weekStats = settings ? getPayStats(allShiftsWithActive, settings, getWeekRange().start, getWeekRange().end) : null
  const monthStats = settings ? getPayStats(allShiftsWithActive, settings, getMonthRange().start, getMonthRange().end) : null
  const weekChart = settings ? buildWeeklyChartData(allShiftsWithActive, settings) : []
  const activeDuration = activeShift ? shiftDurationMs(activeShift) : 0
  const activeUser = users.find(u => u.id === activeUserId) ?? null

  return {
    users, activeUser, activeUserId,
    settings, activeShift, shifts: allShiftsWithActive,
    documents, dayStats, weekStats, monthStats, weekChart,
    activeDuration, tick,
    switchUser, addUser, removeUser,
    clockIn, clockOut, removeShift, editShift,
    updateSettings, addDocument, removeDocument,
  }
}
