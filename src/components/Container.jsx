import React from 'react';

const BaseContainer = ({ children }) => {
  return (

      <div className="container mx-auto p-8">
        {children}
      </div>
  );
};

export default BaseContainer;
