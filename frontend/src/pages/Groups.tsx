import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMyGroups,
  joinGroup,
  fetchPublicGroups,
} from "../services/groupService";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import BaseContainer from "../components/common/Container";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Group } from "../types/rhcp-types";

const GroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's groups
        if (user) {
          const userGroups = await fetchMyGroups();
          setMyGroups(userGroups);
        }

        // Fetch public groups
        const pubGroups = await fetchPublicGroups();
        setPublicGroups(pubGroups);
      } catch (err) {
        console.error("Error loading groups:", err);
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const handleJoinGroup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setJoinError("Please enter an invite code");
      return;
    }

    try {
      setJoinLoading(true);
      setJoinError(null);
      setJoinSuccess(false);

      await joinGroup(inviteCode.trim());

      // Refresh groups after joining
      const userGroups = await fetchMyGroups();
      setMyGroups(userGroups);

      // Clear the invite code and show success message
      setInviteCode("");
      setJoinSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setJoinSuccess(false), 3000);
    } catch (err) {
      console.error("Error joining group:", err);
      setJoinError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoinLoading(false);
    }
  };

  const navigateToGroupDetail = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <BaseContainer>
      {" "}
      <div className="flex flex-col bg-white items-center justify-center px-4">
        <Navbar />{" "}
        <div className="w-full max-w-7xl mx-auto p-4 bg-white">
          <h1 className="text-2xl font-bold mb-6">Groups</h1>

          {/* Join Group with Invite Code */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-medium mb-3">Join a Private Group</h2>
            <form onSubmit={handleJoinGroup} className="flex items-center">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={joinLoading}
                className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {joinLoading ? "Joining..." : "Join Group"}
              </button>
            </form>
            {joinError && (
              <p className="text-red-500 mt-2 text-sm">{joinError}</p>
            )}
            {joinSuccess && (
              <p className="text-green-500 mt-2 text-sm">
                Successfully joined group!
              </p>
            )}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : (
            <>
              {/* My Groups */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">My Groups</h2>
                {myGroups.length === 0 ? (
                  <p className="text-gray-500 italic">
                    You haven't joined any groups yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroups.map((group: Group) => (
                      <div
                        key={group.id}
                        onClick={() => navigateToGroupDetail(group.id)}
                        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        {group.image ? (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                            <span className="text-gray-500">
                              {group.name.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-lg font-medium">{group.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {group.description || "No description"}
                        </p>
                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                          <span>{group.memberCount} members</span>
                          <span className="uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            {group.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Groups */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Public Groups</h2>
                {publicGroups.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No public groups available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicGroups.map((group: Group) => {
                      // Check if user is already a member of this group
                      const isMember = myGroups.some(
                        (g: Group) => g.id === group.id
                      );

                      return (
                        <div
                          key={group.id}
                          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                        >
                          {group.image ? (
                            <img
                              src={group.image}
                              alt={group.name}
                              className="w-full h-32 object-cover rounded-md mb-3"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                              <span className="text-gray-500">
                                {group.name.substring(0, 1)}
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-medium">{group.name}</h3>
                          <p className="text-gray-600 text-sm">
                            {group.description || "No description"}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {group.memberCount} members
                            </span>
                            {isMember ? (
                              <button
                                onClick={() => navigateToGroupDetail(group.id)}
                                className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200"
                              >
                                View Group
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    setJoinLoading(true);
                                    await joinGroup(group.id.toString(), true); // true flag for public group join
                                    // Refresh groups
                                    const userGroups = await fetchMyGroups();
                                    setMyGroups(userGroups);
                                  } catch (err) {
                                    console.error(
                                      "Error joining public group:",
                                      err
                                    );
                                    setJoinError(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to join group"
                                    );
                                  } finally {
                                    setJoinLoading(false);
                                  }
                                }}
                                disabled={joinLoading}
                                className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200 disabled:opacity-50"
                              >
                                {joinLoading ? "Joining..." : "Join Group"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </BaseContainer>
  );
};

export default GroupsPage;
