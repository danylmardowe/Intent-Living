export default function EnvCheck() {
  return (
    <pre style={{padding:16}}>
      {JSON.stringify({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0,6) + '…',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }, null, 2)}
    </pre>
  )
}
