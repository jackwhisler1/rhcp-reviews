// components/common/ErrorDisplay.tsx
import React from "react";

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
}) => {
  const errorMessage =
    typeof error === "string"
      ? error
      : error.message || "An unexpected error occurred";

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
      <h3 className="font-semibold mb-2">Something went wrong</h3>
      <p className="mb-4">{errorMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
