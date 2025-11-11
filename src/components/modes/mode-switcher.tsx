// ✅ src/components/modes/mode-switcher.tsx
"use client";

import { useActiveMode } from "@/lib/useActiveMode";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ModeSwitcher() {
  const { mode, updateMode, availableModes, loading } = useActiveMode();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (availableModes.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No modes available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Mode:</span>
      <Select
        value={mode ?? ""}
        onValueChange={(value) => updateMode(value)}
      >
        <SelectTrigger className="w-[160px] bg-white border-gray-300 shadow-sm">
          <SelectValue placeholder="Select mode" />
        </SelectTrigger>
        <SelectContent>
          {availableModes.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
