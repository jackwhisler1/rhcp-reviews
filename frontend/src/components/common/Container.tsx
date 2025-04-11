import React from "react";
import { ReactNode } from "react";

const BaseContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mx-auto px-4 md:px-8 pb-11 bg-night min-h-screen w-full max-w-full flex items-center justify-center">
      <div className="w-full max-w-screen-xl">{children}</div>
    </div>
  );
};

export default BaseContainer;
