"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reloadIdentifier, setReloadIdentifier] = useState(Date.now());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Effect to detect page reloads
  useEffect(() => {
    // This will run on component mount and page reloads
    const handleBeforeUnload = () => {
      // Set a flag in sessionStorage that we can check on next load
      sessionStorage.setItem('pageReloading', 'true');
    };

    // Check if this is a reload
    const isReload = sessionStorage.getItem('pageReloading') === 'true';
    if (isReload) {
      // Clear the flag
      sessionStorage.removeItem('pageReloading');
      // Update our identifier to trigger the loading effect
      setReloadIdentifier(Date.now());
    }

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Start timer when component mounts or when route changes or page reloads
    setIsLoading(true);
    setStartTime(performance.now());

    // Set a minimum display time for the loading indicator
    const minDisplayTime = 300; // milliseconds

    // Simulate completion after the page has loaded
    const timer = setTimeout(() => {
      if (startTime) {
        const endTime = performance.now();
        const timeTaken = endTime - startTime;
        setLoadTime(timeTaken);
        setIsLoading(false);
      }
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, reloadIdentifier]);

  // Hide the indicator after showing the load time for a few seconds
  useEffect(() => {
    if (!isLoading && loadTime) {
      const hideTimer = setTimeout(() => {
        setLoadTime(null);
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(hideTimer);
    }
  }, [isLoading, loadTime]);

  if (!isLoading && !loadTime) return null;

  return (
    <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-md z-50 text-sm font-medium flex items-center gap-2 transition-opacity">
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Loading...</span>
        </>
      ) : (
        <span>Loaded in {(loadTime! / 1000).toFixed(2)}s</span>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
