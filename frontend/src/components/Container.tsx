import React from "react";

import { ReactNode } from "react";

const BaseContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="container mx-auto px-8 py-11   bg-gray-200 min-h-screen flex items-center justify-center  h-screen">
      {children}
    </div>
  );
};

export default BaseContainer;
