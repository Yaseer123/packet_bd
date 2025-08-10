"use client";

import { Button } from "@/components/ui/button";
import { clearFiredEvents, getFiredEventsCount } from "@/utils/gtm";
import { useEffect, useState } from "react";

export default function GTMDebugger() {
  const [eventCount, setEventCount] = useState({
    clientSide: 0,
    serverSide: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
    }
  }, []);

  const updateEventCount = () => {
    setEventCount(getFiredEventsCount());
  };

  const handleClearEvents = () => {
    clearFiredEvents();
    updateEventCount();
  };

  useEffect(() => {
    // Update count every 2 seconds
    const interval = setInterval(updateEventCount, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 p-4 font-mono text-sm text-white">
      <div className="mb-2">
        <strong>GTM Debugger</strong>
      </div>
      <div className="mb-2">
        <div>Client Events: {eventCount.clientSide}</div>
        <div>Server Events: {eventCount.serverSide}</div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClearEvents}
        className="text-xs"
      >
        Clear Events
      </Button>
    </div>
  );
}
