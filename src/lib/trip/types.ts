export type PlannerEvent = {
  id: string
  title: string
  date: string
  startMinute: number
  endMinute: number
}

export type EventDraft = Omit<PlannerEvent, 'id'>

export type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
}

export type Planner = Trip & {
  events: PlannerEvent[]
}
