import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { get, set } from '../lib/storage'
import { useAuth } from '../contexts/useAuth'
import { errorMessage } from '../lib/errors'
import {
  deleteTrip as deleteTripRow,
  deleteTripEvent,
  fetchTripEvents,
  fetchTrips,
  insertTrip,
  mapDbTrip,
  mapDbTripEvent,
  updateTrip,
  upsertTripEvent
} from '../lib/db'
import type { DbTrip, DbTripEvent } from '../lib/db'
import type {
  EventDraft,
  Planner,
  PlannerEvent,
  Trip
} from '../lib/trip/types'

const ACTIVE_TRIP_KEY = 'active-trip'

function withoutKey<T>(record: Record<string, T>, key: string) {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
}

export function useTripPlanner() {
  const { user } = useAuth()
  const userId = user?.id
  const [trips, setTrips] = useState<Trip[]>([])
  // Events are cached per trip; a missing key means "not loaded yet".
  const [eventsByTrip, setEventsByTrip] = useState<
    Record<string, PlannerEvent[]>
  >({})
  const [preferredId, setPreferredId] = useState<string | null>(() =>
    get<string>(ACTIVE_TRIP_KEY)
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const activeTrip = trips.find((t) => t.id === preferredId) ?? trips[0] ?? null
  const activeTripId = activeTrip?.id ?? null
  const activeEvents = activeTripId ? eventsByTrip[activeTripId] : undefined

  useEffect(() => {
    fetchTrips()
      .then((rows) => setTrips(rows.map(mapDbTrip)))
      .catch((err) => setError(`Could not load trips. ${errorMessage(err)}`))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const needsEvents = activeTripId !== null && activeEvents === undefined
  useEffect(() => {
    if (!needsEvents || !activeTripId) return
    let cancelled = false
    fetchTripEvents(activeTripId)
      .then((rows) => {
        if (cancelled) return
        setEventsByTrip((prev) => ({
          ...prev,
          [activeTripId]: rows.map(mapDbTripEvent)
        }))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(`Could not load the trip. ${errorMessage(err)}`)
        }
      })
    return () => {
      cancelled = true
    }
  }, [needsEvents, activeTripId, reloadKey])

  useEffect(() => {
    const channel = supabase
      .channel('trip-planner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_events' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = payload.old.id as string | undefined
            if (!id) return
            setEventsByTrip((prev) =>
              Object.fromEntries(
                Object.entries(prev).map(([tripId, list]) => [
                  tripId,
                  list.filter((e) => e.id !== id)
                ])
              )
            )
            return
          }
          const row = payload.new as DbTripEvent
          const event = mapDbTripEvent(row)
          setEventsByTrip((prev) => {
            const list = prev[row.trip_id]
            if (!list) return prev
            return {
              ...prev,
              [row.trip_id]: list.some((e) => e.id === event.id)
                ? list.map((e) => (e.id === event.id ? event : e))
                : [...list, event]
            }
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = payload.old.id as string | undefined
            if (!id) return
            setTrips((prev) => prev.filter((t) => t.id !== id))
            setEventsByTrip((prev) => withoutKey(prev, id))
            return
          }
          const trip = mapDbTrip(payload.new as DbTrip)
          setTrips((prev) =>
            prev.some((t) => t.id === trip.id)
              ? prev.map((t) => (t.id === trip.id ? trip : t))
              : [...prev, trip]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Writes are optimistic; on failure, resync from the server and show the error.
  const recover = useCallback((action: string, err: unknown) => {
    setEventsByTrip({})
    setReloadKey((k) => k + 1)
    setError(`Could not ${action}. ${errorMessage(err)}`)
  }, [])

  const selectTrip = useCallback((id: string) => {
    setPreferredId(id)
    set(ACTIVE_TRIP_KEY, id)
  }, [])

  const createTrip = useCallback(
    (name: string, startDate: string, endDate: string): boolean => {
      if (!userId) return false
      const trip: Trip = {
        id: crypto.randomUUID(),
        name: name.trim(),
        startDate,
        endDate
      }
      setError(null)
      setTrips((prev) => [...prev, trip])
      setEventsByTrip((prev) => ({ ...prev, [trip.id]: [] }))
      selectTrip(trip.id)
      insertTrip(userId, trip).catch((err) => recover('create the trip', err))
      return true
    },
    [userId, selectTrip, recover]
  )

  const renameTrip = useCallback(
    (name: string): boolean => {
      if (!activeTripId) return false
      const trimmed = name.trim()
      setError(null)
      setTrips((prev) =>
        prev.map((t) => (t.id === activeTripId ? { ...t, name: trimmed } : t))
      )
      updateTrip(activeTripId, { name: trimmed }).catch((err) =>
        recover('rename the trip', err)
      )
      return true
    },
    [activeTripId, recover]
  )

  const updateRange = useCallback(
    (startDate: string, endDate: string): boolean => {
      if (!activeTripId) return false
      setError(null)
      setTrips((prev) =>
        prev.map((t) =>
          t.id === activeTripId ? { ...t, startDate, endDate } : t
        )
      )
      updateTrip(activeTripId, { startDate, endDate }).catch((err) =>
        recover('update the trip dates', err)
      )
      return true
    },
    [activeTripId, recover]
  )

  const deleteTrip = useCallback(
    (id: string): boolean => {
      setError(null)
      setTrips((prev) => prev.filter((t) => t.id !== id))
      setEventsByTrip((prev) => withoutKey(prev, id))
      deleteTripRow(id).catch((err) => recover('delete the trip', err))
      return true
    },
    [recover]
  )

  const saveEvent = useCallback(
    (draft: EventDraft, id?: string): boolean => {
      if (!activeTripId || !activeEvents) return false
      const event: PlannerEvent = {
        ...draft,
        title: draft.title.trim(),
        id: id ?? crypto.randomUUID()
      }
      setError(null)
      setEventsByTrip((prev) => ({
        ...prev,
        [activeTripId]: id
          ? activeEvents.map((item) => (item.id === id ? event : item))
          : [...activeEvents, event]
      }))
      upsertTripEvent(activeTripId, event).catch((err) =>
        recover('save the event', err)
      )
      return true
    },
    [activeTripId, activeEvents, recover]
  )

  const deleteEvent = useCallback(
    (id: string): boolean => {
      if (!activeTripId || !activeEvents) return false
      setError(null)
      setEventsByTrip((prev) => ({
        ...prev,
        [activeTripId]: activeEvents.filter((event) => event.id !== id)
      }))
      deleteTripEvent(id).catch((err) => recover('delete the event', err))
      return true
    },
    [activeTripId, activeEvents, recover]
  )

  const retry = useCallback(() => {
    setError(null)
    setLoading(true)
    setEventsByTrip({})
    setReloadKey((k) => k + 1)
  }, [])

  const planner = useMemo<Planner | null>(
    () => (activeTrip && activeEvents ? { ...activeTrip, events: activeEvents } : null),
    [activeTrip, activeEvents]
  )

  return {
    trips,
    activeTripId,
    planner,
    loading,
    error,
    selectTrip,
    createTrip,
    renameTrip,
    deleteTrip,
    updateRange,
    saveEvent,
    deleteEvent,
    retry
  }
}
