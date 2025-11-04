// src/components/daily-review/daily-review-workflow.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Edit } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Import the new card components
import ObjectivesCard from './objectives-card' // We will create this next
import GeneralJournalingCard from './general-journaling-card'
import LifeAreaJournalingCard from './life-area-journaling-card'
import AppreciationCard from './appreciation-card'

function getTodayId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type DailyReviewState = {
  objectives: boolean;
  generalJournal: boolean;
  lifeAreaJournals: boolean;
  appreciation: boolean;
}

export default function DailyReviewWorkflow() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditable, setIsEditable] = useState(true)

  const [completionState, setCompletionState] = useState<DailyReviewState>({
    objectives: false,
    generalJournal: false,
    lifeAreaJournals: false,
    appreciation: false,
  })

  useEffect(() => {
    // On page load, check if today's review is already finalized
    const checkFinalization = async () => {
        if (!user) return
        const todayId = getTodayId()
        const reviewRef = doc(db, 'users', user.uid, 'dailyReviews', todayId)
        const docSnap = await getDoc(reviewRef)
        if (docSnap.exists() && docSnap.data().finalized) {
            setIsEditable(false)
            setCompletionState({ objectives: true, generalJournal: true, lifeAreaJournals: true, appreciation: true })
        }
    }
    checkFinalization()
  }, [user])

  const handleSingleSubmit = async (section: keyof DailyReviewState, data: any) => {
    if (!user) return
    const todayId = getTodayId()
    const reviewRef = doc(db, 'users', user.uid, 'dailyReviews', todayId)
    
    await setDoc(reviewRef, { 
      [section]: data,
      lastUpdated: serverTimestamp()
    }, { merge: true })

    setCompletionState(prev => ({ ...prev, [section]: true }))
  }

  const handleFinalize = async () => {
    if (!user) return
    const todayId = getTodayId()
    const reviewRef = doc(db, 'users', user.uid, 'dailyReviews', todayId)

    await setDoc(reviewRef, {
        finalized: true,
        finalizedAt: serverTimestamp()
    }, { merge: true })

    setIsEditable(false)
    router.push(`/daily-review/${todayId}`)
  }

  const allSectionsSubmitted = Object.values(completionState).every(Boolean)

  return (
    <div className="space-y-6">
      {!isEditable && (
        <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Review Complete!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                You've finalized your review for today. Well done!
                <Button variant="outline" size="sm" onClick={() => setIsEditable(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Review
                </Button>
            </AlertDescription>
        </Alert>
      )}

      {/* We need to create ObjectivesCard to replace the old inline logic */}
      <ObjectivesCard
        isSubmitted={completionState.objectives}
        onSubmit={(data) => handleSingleSubmit('objectives', data)}
        isEditable={isEditable}
      />
      
      <GeneralJournalingCard
        isSubmitted={completionState.generalJournal}
        onSubmit={(today, tomorrow) => handleSingleSubmit('generalJournal', { today, tomorrow })}
      />

      <LifeAreaJournalingCard
        isSubmitted={completionState.lifeAreaJournals}
        onSubmit={(entries) => handleSingleSubmit('lifeAreaJournals', entries)}
      />

      <AppreciationCard
        isSubmitted={completionState.appreciation}
        onSubmit={(text) => handleSingleSubmit('appreciation', { text })}
      />

      {allSectionsSubmitted && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-6">
          <h3 className="text-xl font-semibold">Ready to Complete Your Review?</h3>
          <p className="text-sm text-muted-foreground">
            All sections have been submitted. You can now finalize the review to generate your comprehensive PDF report.
          </p>
          <Button size="lg" onClick={handleFinalize}>
            Finalize & Generate PDF Report
          </Button>
        </div>
      )}
    </div>
  )
}