import React from "react";

export const LoadingSpinner = ({ size = "md", fullPage = false }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-savomart-purple-light border-t-savomart-purple rounded-full animate-spin`}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-savomart-yellow rounded-full animate-ping" />
      </div>
      <p className="text-xs font-semibold tracking-widest uppercase text-savomart-purple-dark animate-pulse">
        Savomart
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F4FA]/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
