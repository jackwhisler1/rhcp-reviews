import React from "react";

import { ReactNode } from "react";

const BaseContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mx-auto px-8 py-11 bg-night min-h-screen min-w-max flex items-center justify-center">
      {children}
    </div>
  );
};

export default BaseContainer;
