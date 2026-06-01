import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getDB, getSettings, saveSettings, getActiveShift,
  clockIn as dbClockIn, clockOut as dbClockOut,
  getAllShifts, deleteShift, updateShift,
  getAllDocuments, saveDocument, deleteDocument,
} from '../lib/db'
import type { Shift, Settings, Document } from '../lib/db'
import {
  getPayStats, getDayRange, getWeekRange, getMonthRange,
  buildWeeklyChartData, shiftDurationMs,
} from '../lib/pay'

export function usePayTracker() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | undefined>(undefined)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [tick, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function init() {
      await getDB()
      const [s, a, all, docs] = await Promise.all([
        getSettings(),
        getActiveShift(),
        getAllShifts(),
        getAllDocuments(),
      ])
      setSettings(s)
      setActiveShift(a)
      setShifts(all)
      setDocuments(docs)
    }
    init()
  }, [])

  useEffect(() => {
    if (activeShift) {
      tickRef.current = setInterval(() => setTick(t => t + 1), 1000)
    } else {
      if (tickRef.current) clearInterval(tickRef.current)
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [activeShift?.id])

  const clockIn = useCallback(async (note?: string) => {
    const shift = await dbClockIn(note)
    setActiveShift(shift)
    setShifts(prev => [...prev, shift])
  }, [])

  const clockOut = useCallback(async () => {
    const shift = await dbClockOut()
    setActiveShift(undefined)
    setShifts(prev => prev.map(s => s.id === shift.id ? shift : s))
  }, [])

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

  return {
    settings,
    activeShift,
    shifts: allShiftsWithActive,
    documents,
    dayStats,
    weekStats,
    monthStats,
    weekChart,
    activeDuration,
    tick,
    clockIn,
    clockOut,
    removeShift,
    editShift,
    updateSettings,
    addDocument,
    removeDocument,
  }
}
