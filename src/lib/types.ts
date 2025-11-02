export type ActivityType = {
  id: string
  title: string
  defaultLifeAreaId?: string | null
}

export type Activity = {
  id: string
  title: string
  typeId: string
  lifeAreaId?: string | null
  // For generic activities these may be omitted:
  startTime?: Date | null
  endTime?: Date | null
  durationMinutes?: number | null
  notes?: string | null
  createdAt: Date
}
