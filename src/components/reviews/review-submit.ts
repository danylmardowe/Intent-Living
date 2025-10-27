// src/app/(app)/reviews/review-submit.ts
'use client'

import { auth, db, storage } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'sixMonthly'

export async function submitReviewAndPdf(options: {
  cadence: Cadence
  data: any
  captureEl: HTMLElement
}) {
  const { cadence, data, captureEl } = options
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')

  const dayId = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const reviewPath = `users/${uid}/reviews/${cadence}/${dayId}`

  // 1) Write/overwrite review doc metadata
  await setDoc(doc(db, reviewPath), {
    createdAt: serverTimestamp(),
    cadence,
    dayId,
    payload: data ?? null,
  })

  // 2) Generate PDF
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(captureEl, { backgroundColor: '#ffffff', scale: 2 })
  const imgData = canvas.toDataURL('image/png')

  // NOTE: use `compress` (not compressPdf) in options object
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true })
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()
  const ratio = Math.min(pw / canvas.width, ph / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  const x = (pw - w) / 2
  const y = 24
  pdf.addImage(imgData, 'PNG', x, y, w, h)

  const blob = pdf.output('blob')

  // 3) Upload to Storage
  const storagePath = `reports/${uid}/${cadence}/${dayId}.pdf`
  const r = ref(storage, storagePath)
  await uploadBytes(r, blob, { contentType: 'application/pdf' })
  const downloadURL = await getDownloadURL(r)

  // 4) Update doc with storage metadata
  await setDoc(doc(db, reviewPath), {
    createdAt: Timestamp.now(),
    cadence,
    dayId,
    payload: data ?? null,
    storagePath,
    downloadURL,
  })

  return { storagePath, downloadURL, reviewPath }
}
