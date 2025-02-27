import { Link } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";

const Navbar: React.FC = () => {
  const currentUser = getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto mt-8 text-center">
      <h1 className="text-3xl font-bold text-red-700 mb-4">
        Welcome to the Music Review App
      </h1>

      <p className="text-lg mb-6">
        Share your thoughts on your favorite songs and discover new music
        through other users' reviews.
      </p>

      <div className="mt-8">
        {currentUser ? (
          <div className="space-y-4">
            <p className="text-xl">Welcome back, {currentUser.username}!</p>
            <div className="flex space-x-4 justify-center">
              <Link
                to="/submit-review"
                className="bg-red-700 text-white py-2 px-6 rounded-lg hover:bg-red-800 transition-colors"
              >
                Submit a Review
              </Link>
              <Link
                to="/reviews"
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Browse Reviews
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xl">
              Join our community to start sharing reviews!
            </p>
            <div className="flex space-x-4 justify-center">
              <Link
                to="/register"
                className="bg-red-700 text-white py-2 px-6 rounded-lg hover:bg-red-800 transition-colors"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-700 mb-4">How It Works</h2>
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
    </div>
  );
};
export default Navbar;
