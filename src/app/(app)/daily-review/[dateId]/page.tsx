// src/app/(app)/daily-review/[dateId]/page.tsx
'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import { TriStatus } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle2, Download, Frown, Triangle, XCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// This will hold the complete data for the day's review
type DailyReviewData = {
    objectives?: Record<string, { status: TriStatus, note: string }>
    generalJournal?: { today: string, tomorrow: string }
    lifeAreaJournals?: Record<string, string>
    appreciation?: { text: string }
    finalized: boolean
}

export default function DailyReviewReportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const dateId = params.dateId as string

  const [loading, setLoading] = useState(true)
  const [reviewData, setReviewData] = useState<DailyReviewData | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !dateId) return
    const fetchReviewData = async () => {
      setLoading(true)
      const reviewRef = doc(db, 'users', user.uid, 'dailyReviews', dateId)
      const docSnap = await getDoc(reviewRef)
      if (docSnap.exists()) {
        setReviewData(docSnap.data() as DailyReviewData)
      }
      setLoading(false)
    }
    fetchReviewData()
  }, [user, dateId])

  const handleGeneratePdf = async () => {
    const input = reportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Intent-Living-Daily-Review-${dateId}.pdf`);
  }
  
  const StatusIcon = ({ status }: { status: TriStatus }) => {
    if (status === 'yes') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (status === 'partial') return <Triangle className="h-5 w-5 text-amber-500" />
    if (status === 'no') return <XCircle className="h-5 w-5 text-red-600" />
    return null
  }

  const reportDate = new Date(dateId + 'T12:00:00')

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/daily-review')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review Workspace
        </Button>
        <Button onClick={handleGeneratePdf} disabled={loading || !reviewData}>
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>
      <div ref={reportRef} className="p-4 rounded-lg bg-white dark:bg-card">
        {loading && <Skeleton className="h-96 w-full" />}
        {!loading && !reviewData && (
          <Alert variant="destructive">
            <Frown className="h-4 w-4" />
            <AlertTitle>No Review Found</AlertTitle>
            <AlertDescription>No review data was found for this date.</AlertDescription>
          </Alert>
        )}
        {reviewData && (
          <div className="space-y-6">
            <header className="space-y-1">
                <h1 className="text-3xl font-bold">Daily Review Report</h1>
                <p className="text-muted-foreground">
                    A summary for {reportDate.toLocaleDateString('en-US', { dateStyle: 'long' })}.
                </p>
            </header>

            {/* Objectives Section */}
            {reviewData.objectives && (
                <section>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Daily Objectives</h2>
                    <div className="space-y-4">
                        {Object.entries(reviewData.objectives).map(([id, data]) => (
                            <div key={id} className="p-3 rounded-md border">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{id /* Ideally, we'd fetch the title */}</p>
                                    <StatusIcon status={data.status} />
                                </div>
                                {data.note && <p className="text-sm text-muted-foreground mt-1 italic pl-2 border-l-2">{data.note}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* General Journal Section */}
            {reviewData.generalJournal && (
                <section>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">General Journal</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-1">What I did today:</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reviewData.generalJournal.today}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-1">My plan for tomorrow:</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reviewData.generalJournal.tomorrow}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Appreciation Section */}
            {reviewData.appreciation && (
                <section>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Appreciation</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reviewData.appreciation.text}</p>
                </section>
            )}
            
            {/* Life Area Journals not displayed for brevity, but could be added similarly */}

          </div>
        )}
      </div>
    </div>
  )
}