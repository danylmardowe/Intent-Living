'use client'

import * as React from 'react'
import GeneralJournalingCard from './general-journaling-card'
import { GenerateResponse } from '@/lib/ai-extraction-types'
import AiSuggestionsCard from './ai-suggestions-card'
import ObjectivesCard from './objectives-card'
import LifeAreaJournalingCard from './life-area-journaling-card'
import AppreciationCard from './appreciation-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DailyReviewWorkflow() {
  // State for the new AI suggestions workflow
  const [suggestions, setSuggestions] = React.useState<GenerateResponse | null>(null)
  const [sourceJournalEntryId, setSourceJournalEntryId] = React.useState<string | null>(null)
  
  // State for the other review cards
  const [objectivesSubmitted, setObjectivesSubmitted] = React.useState(false)
  const [lifeAreasSubmitted, setLifeAreasSubmitted] = React.useState(false)
  const [appreciationSubmitted, setAppreciationSubmitted] = React.useState(false)

  // Handler for when the AI extraction is complete - corrected signature
  const handleExtractComplete = (result: GenerateResponse, entryId: string | null) => {
    // Only set suggestions if we have a valid entryId to link them to
    if (entryId) {
      setSuggestions(result)
      setSourceJournalEntryId(entryId)
    } else {
      // If entryId is null, it means saving failed, so we don't show suggestions.
      setSuggestions(null)
      setSourceJournalEntryId(null)
    }
  }

  // Handler to clear/dismiss the suggestions card
  const handleClearSuggestions = () => {
    setSuggestions(null)
    setSourceJournalEntryId(null)
  }

  // Submission handlers for the other cards (with explicit 'any' to resolve TS errors for now)
  // TODO: Replace 'any' with the actual data types from each component once defined.
  const handleObjectivesSubmit = async (data: any) => {
    console.log('Objectives submitted:', data)
    setObjectivesSubmitted(true)
  }

  const handleLifeAreasSubmit = async (entries: any) => {
    console.log('Life Areas submitted:', entries)
    setLifeAreasSubmitted(true)
  }

  const handleAppreciationSubmit = async (gratitudeText: any) => {
    console.log('Appreciation submitted:', gratitudeText)
    setAppreciationSubmitted(true)
  }

  return (
    <div className="grid gap-6">
      {/* 1) General Journaling (required, first) */}
      <GeneralJournalingCard onExtractComplete={handleExtractComplete} />

      {/* 2) AI Suggestions (appears after journaling) */}
      {suggestions && (
        <AiSuggestionsCard
          suggestions={suggestions}
          sourceJournalEntryId={sourceJournalEntryId}
          onClear={handleClearSuggestions}
        />
      )}

      {/* 3) Other review cards */}
      <ObjectivesCard
        isSubmitted={objectivesSubmitted}
        isEditable={!objectivesSubmitted}
        onSubmit={handleObjectivesSubmit}
      />

      <LifeAreaJournalingCard
        isSubmitted={lifeAreasSubmitted}
        onSubmit={handleLifeAreasSubmit}
      />

      <AppreciationCard
        isSubmitted={appreciationSubmitted}
        onSubmit={handleAppreciationSubmit}
      />

      {/* 5) Export / Summary (read-only recap) */}
      <Card>
        <CardHeader>
          <CardTitle>Export / Summary</CardTitle>
          <CardDescription>Aggregation of entries and extracted items (coming soon).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Export to PDF and share your day (soon).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}