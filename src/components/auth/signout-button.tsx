// ✅ src/components/auth/signout-button.tsx
"use client";

import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      router.push("/"); // 👈 Redirect to landing page instead of /login
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
    >
      Sign Out
    </button>
  );
}
