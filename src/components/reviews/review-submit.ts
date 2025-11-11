// src/components/reviews/review-submit.ts
'use client'

import { auth, db, storage } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'sixMonthly'

export async function submitReviewAndPdf(opts: {
  cadence: Cadence
  data: any
  captureEl: HTMLElement
}) {
  const { cadence, data, captureEl } = opts
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')

  const dayId = new Date().toISOString().slice(0, 10)
  const reviewRef = doc(db, `users/${uid}/reviews/${cadence}/items/${dayId}`)

  let blob: Blob | null = null
  let generationError: any = null

  // ---- 1) Try to render the page section ----
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(captureEl, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,     // try to fetch cross-origin images
      allowTaint: true,  // allow tainted canvas if needed
      logging: false,
    })

    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true })
    const pw = pdf.internal.pageSize.getWidth()
    const ph = pdf.internal.pageSize.getHeight()
    const r = Math.min(pw / canvas.width, ph / canvas.height)
    const w = canvas.width * r
    const h = canvas.height * r
    pdf.addImage(img, 'PNG', (pw - w) / 2, 24, w, h)
    blob = pdf.output('blob')
  } catch (err) {
    generationError = err
  }

  // ---- 2) If render failed, fall back to a simple text-only PDF ----
  if (!blob) {
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true })
      pdf.setFontSize(16)
      pdf.text(`Lifeline Review (${cadence})`, 40, 50)
      pdf.setFontSize(11)
      pdf.text(`Date: ${dayId}`, 40, 75)
      pdf.text(`(Fallback PDF: UI section capture failed)`, 40, 95)
      pdf.text(`Notes:`, 40, 125)
      const body = JSON.stringify(opts.data ?? {}, null, 2)
      const lines = pdf.splitTextToSize(body, 520)
      pdf.text(lines, 40, 145)
      blob = pdf.output('blob')
    } catch (err) {
      // Couldn’t even create fallback PDF – record error and bail.
      await setDoc(
        reviewRef,
        {
          createdAt: Timestamp.now(),
          cadence,
          dayId,
          payload: opts.data ?? null,
          status: 'error',
          error: `PDF generation failed: ${String(generationError?.message ?? generationError)} | fallback: ${String(
            (err as any)?.message ?? err
          )}`,
        },
        { merge: true }
      )
      throw err
    }
  }

  // ---- 3) Upload to Storage ----
  try {
    const storagePath = `reports/${uid}/${cadence}/${dayId}.pdf`
    const fileRef = ref(storage, storagePath)
    await uploadBytes(fileRef, blob, { contentType: 'application/pdf' })
    const downloadURL = await getDownloadURL(fileRef)

    // Write review doc ONLY after upload succeeds
    await setDoc(reviewRef, {
      createdAt: Timestamp.now(),
      cadence,
      dayId,
      payload: opts.data ?? null,
      storagePath,
      downloadURL,
      status: 'done',
      error: null,
    })

    return { storagePath, downloadURL }
  } catch (err: any) {
    // Persist detailed error
    await setDoc(
      reviewRef,
      {
        createdAt: Timestamp.now(),
        cadence,
        dayId,
        payload: opts.data ?? null,
        status: 'error',
        error: `Upload failed: code=${(err?.code ?? 'unknown')} message=${String(err?.message ?? err)}`,
      },
      { merge: true }
    )
    throw err
  }
}
