import axios from "axios";
import { getCurrentUser } from "./authService";
import { SongStat } from "../types/rhcp-types";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

/**
 * Get statistics for songs in an album
 */
export const getAlbumStats = async (
  albumId: number,
  params: any
): Promise<SongStat[]> => {
  try {
    // Get current user token
    const user = getCurrentUser();

    // Create headers with auth token
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if we have a token
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
      console.log(`Using auth token: ${user.token.substring(0, 10)}...`);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params.groupId && params.groupId !== "all") {
      queryParams.append("groupId", params.groupId.toString());
    }

    if (params.userId && params.userId !== "all") {
      queryParams.append("userId", params.userId.toString());
    }

    // Build URL - Make sure this matches your backend route definition exactly
    // Check if it should be '/albums/:albumId/songs/stats' or '/:albumId/songs/stats'
    let url = `${API_BASE}/albums/${albumId}/songs/stats`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    console.log(`Requesting album stats from: ${url}`);

    // For debugging: log the exact route your backend expects
    console.log(
      "Your backend should have a route like: router.get('/:albumId/songs/stats', ...)"
    );

    const response = await axios.get<SongStat[]>(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching album stats for album ${albumId}:`, error);

    // More detailed error logging for debugging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received, request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    // Generic error
    throw new Error("Failed to load song statistics");
  }
};

/**
 * Fallback to get public album stats when group access fails
 */
const getPublicAlbumStats = async (albumId: number): Promise<SongStat[]> => {
  try {
    // Make a request for public stats only (no groupId)
    const url = `${API_BASE}/albums/${albumId}/songs/stats`;
    console.log(`Falling back to public stats: ${url}`);

    const response = await axios.get<SongStat[]>(url);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching public album stats for album ${albumId}:`,
      error
    );
    throw new Error("Failed to load song statistics");
  }
};
