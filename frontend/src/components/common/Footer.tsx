import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-gray-200 py-4 text-center text-sm text-gray-600">
      <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Create an Account</h3>
            <p>Sign up for free and join our community of music enthusiasts.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              2. Share Your Reviews
            </h3>
            <p>Rate and review songs you love, hate, or feel neutral about.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              3. Discover New Music
            </h3>
            <p>
              Browse reviews from other users to find your next favorite song.
            </p>
          </div>
        </div>
      </div>
      <p>© 2023 RHCP Reviews. All rights reserved.</p>
      <p>Data from Red Hot Chili Peppers discography</p>
    </footer>
  );
};

export default Footer;
