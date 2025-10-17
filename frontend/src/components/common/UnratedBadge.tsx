import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

interface UnratedBadgeProps {
  className?: string;
}

const UnratedBadge: React.FC<UnratedBadgeProps> = ({ className = "" }) => {
  return (
    <span
      className={`
        inline-flex items-center 
        px-2 py-1 
        rounded-full 
        text-xs font-medium
        bg-yellow-100 text-yellow-800
        ${className}
      `}
    >
      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
      Not Rated
    </span>
  );
};

export default UnratedBadge;
