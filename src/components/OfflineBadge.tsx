/** Shows online/offline state. Data is saved on-device, so offline is safe. */
import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold">
      {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
      {online ? "Online" : "Offline"}
    </span>
  );
}
