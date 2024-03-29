import React from "react";

const BaseContainer = ({ children }) => {
  return (
    <div className="container mx-auto px-8 py-11   bg-gray-200 min-h-screen flex items-center justify-center  h-screen">
      {children}
    </div>
  );
};

export default BaseContainer;
