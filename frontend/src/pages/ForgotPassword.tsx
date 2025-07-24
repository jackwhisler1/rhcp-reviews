import { useState } from "react";
import { sendPasswordResetEmail } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendPasswordResetEmail(email); // You'll implement this
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="input"
      />
      <button type="submit" className="btn">
        Send reset link
      </button>
      {status === "sent" && <p>Email sent!</p>}
      {status === "error" && <p>Error sending email.</p>}
    </form>
  );
};
export default ForgotPassword;
