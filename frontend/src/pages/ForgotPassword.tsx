import { useState } from "react";
import { sendPasswordResetEmail } from "../services/authService";
import { ReactComponent as Logo } from "../assets/rht-logo.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendPasswordResetEmail(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-night items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white-smoke rounded-md shadow-lg">
        <a href="/" className="py-4 flex justify-center">
          <Logo
            width={600}
            height={320}
            className="mx-auto fill-current justify-center"
          />
        </a>
        <h2 className="mb-4 text-night text-lg font-semibold text-center">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="forEmail" className="block text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="forEmail"
              className="py-3 px-4 block w-full border rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid my-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke hover:bg-blood-red font-medium rounded-sm transition-colors"
            >
              {status === "sending" ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          {status === "sent" && (
            <p className="text-green-600 text-center">Email sent!</p>
          )}
          {status === "error" && (
            <p className="text-imperial-red text-center">
              Error sending email.
            </p>
          )}

          <div className="flex justify-center gap-2 items-center mt-4">
            <p className="text-base font-semibold text-silver">
              Remembered your password?
            </p>
            <a
              href="/login"
              className="text-sm font-semibold hover:text-blood-red"
            >
              Sign In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
