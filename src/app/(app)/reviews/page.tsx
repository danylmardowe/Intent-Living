// src/app/(app)/reviews/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  // Your sidebar links to cadence pages directly. Send /reviews → /reviews/daily.
  redirect('/reviews/daily');
}
