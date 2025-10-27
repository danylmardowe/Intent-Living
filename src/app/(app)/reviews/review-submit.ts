// src/components/reviews/review-submit.ts
'use client'

import { auth, db, storage } from '@/lib/firebase'
import {
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export type Cadence = 'daily'|'weekly'|'monthly'|'sixMonthly'

export async function submitReviewAndPdf(options: {
  cadence: Cadence
  data: any
  captureEl: HTMLElement // element to render to PDF
}) {
  const { cadence, data, captureEl } = options
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')

  const dayId = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const reviewPath = `users/${uid}/reviews/${cadence}/${dayId}`

  // 1) create Firestore doc (metadata + payload)
  await setDoc(doc(db, reviewPath), {
    createdAt: serverTimestamp(),
    cadence,
    dayId,
    payload: data ?? null,
  })

  // 2) generate PDF client-side (html2canvas + jsPDF)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(captureEl, {
    backgroundColor: '#111827', // dark bg safety
    scale: 2,
  })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
    compressPdf: true,
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // fit image into A4
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  const x = (pageWidth - w) / 2
  const y = 24
  pdf.addImage(imgData, 'PNG', x, y, w, h)

  const pdfBlob = pdf.output('blob')

  // 3) upload to Storage
  const storagePath = `reports/${uid}/${cadence}/${dayId}.pdf`
  const r = ref(storage, storagePath)
  await uploadBytes(r, pdfBlob, {
    contentType: 'application/pdf',
  })
  const downloadURL = await getDownloadURL(r)

  // 4) update Firestore doc with storage metadata
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
