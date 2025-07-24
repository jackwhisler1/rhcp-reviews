const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

export const fetchWrapper = async (url: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log(`Sending forgot password email to ${email}`);

    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // include the email in the POST body
    };

    const data = await fetchWrapper(`/users/forgot-password`, options);
    return data;
  } catch (error) {
    console.error(`Error with forgot password operation`, error);
    throw error;
  }
};
