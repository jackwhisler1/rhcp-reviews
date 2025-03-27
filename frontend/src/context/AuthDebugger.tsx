// AuthDebugger.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const AuthDebugger = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Get the token from sessionStorage to show in the debugger
  const storedData = sessionStorage.getItem("rht-user");
  let token = "None";
  let refreshToken = "None";

  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      token = parsed.token ? `${parsed.token.slice(0, 15)}...` : "None";
      refreshToken = parsed.refreshToken
        ? `${parsed.refreshToken.slice(0, 15)}...`
        : "None";
    } catch (e) {
      console.error("Error parsing stored auth data:", e);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        zIndex: 9999,
        fontSize: "12px",
        maxWidth: "300px",
        overflow: "auto",
      }}
    >
      <h4>Auth Debugger</h4>
      <p>
        <strong>Loading:</strong> {loading ? "true" : "false"}
      </p>
      <p>
        <strong>Authenticated:</strong> {isAuthenticated ? "true" : "false"}
      </p>
      <p>
        <strong>User:</strong> {user ? user.username : "None"}
      </p>
      <p>
        <strong>Token:</strong> {token}
      </p>
      <p>
        <strong>Refresh Token:</strong> {refreshToken}
      </p>
      {user && (
        <pre style={{ fontSize: "10px" }}>{JSON.stringify(user, null, 2)}</pre>
      )}
      <button
        onClick={() => {
          const data = sessionStorage.getItem("rht-user");
          console.log("Session Storage:", data ? JSON.parse(data) : null);
          console.log("Auth Context User:", user);
        }}
        style={{ fontSize: "10px", padding: "2px 5px" }}
      >
        Debug Auth
      </button>
    </div>
  );
};

export default AuthDebugger;
