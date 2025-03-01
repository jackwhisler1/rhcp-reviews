import { Link } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";
import { ReactComponent as Logo } from "../../assets/rht-logo.svg";

const Navbar: React.FC = () => {
  const currentUser = getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto mt-8 text-center">
      {/* Logo centered */}
      <div className="flex justify-center mb-4">
        <Logo width={220} height={120} className="fill-current" />
      </div>

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
    </div>
  );
};

export default Navbar;
