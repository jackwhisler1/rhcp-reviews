import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchGroupDetails,
  fetchGroupMembers,
  sendGroupInvite,
} from "../services/groupService";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import BaseContainer from "../components/common/Container";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Group, GroupMember } from "../types/rhcp-types";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isAdmin = group?.role === "admin";

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch group details
        const groupData = await fetchGroupDetails(groupId);
        setGroup(groupData);

        // Fetch group members
        const membersData = await fetchGroupMembers(groupId);
        setMembers(membersData);
      } catch (err) {
        console.error("Error loading group data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load group data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupId]);

  const handleInviteUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!email.trim()) {
      setInviteError("Please enter an email address");
      return;
    }

    if (!isAdmin) {
      setInviteError("Only group admins can send invites");
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(false);

      await sendGroupInvite(groupId!, email.trim());

      // Clear email and show success message
      setEmail("");
      setInviteSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error("Error inviting user:", err);
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <LoadingSpinner />
        </div>
      </BaseContainer>
    );

  if (error)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
          <button
            onClick={() => navigate("/groups")}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back to Groups
          </button>
        </div>
      </BaseContainer>
    );

  if (!group)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
            Group not found
          </div>
          <button
            onClick={() => navigate("/groups")}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back to Groups
          </button>
        </div>
      </BaseContainer>
    );

  return (
    <BaseContainer>
      <div className="flex flex-col bg-white items-center justify-center px-4">
        <Navbar />
        <div className="w-full max-w-7xl mx-auto p-4 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <button
              onClick={() => navigate("/groups")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Back to Groups
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group Info */}
            <div className="bg-white rounded-lg shadow-md p-4 md:col-span-1">
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">
                    {group.name.substring(0, 1)}
                  </span>
                </div>
              )}
              <p className="text-gray-600 mb-4">
                {group.description || "No description"}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{members.length} members</span>
                <span
                  className={`uppercase ${
                    group.isPrivate
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  } px-2 py-1 rounded-full`}
                >
                  {group.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Your role:</span>
                <span className="uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full ml-2">
                  {group.role}
                </span>
              </div>

              {/* Invite Code (for private groups) */}
              {group.isPrivate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium mb-2">
                    Group Invite Code
                  </h3>
                  <div className="flex items-center">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-grow overflow-x-auto">
                      {group.inviteCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(group.inviteCode);
                        alert("Invite code copied to clipboard!");
                      }}
                      className="ml-2 p-2 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this code with others to invite them to the group
                  </p>
                </div>
              )}
            </div>

            {/* Group Members & Invite Form */}
            <div className="md:col-span-2">
              {/* Invite Users (admins only) */}
              {isAdmin && group.isPrivate && (
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <h2 className="text-lg font-medium mb-3">Invite Users</h2>
                  <form
                    onSubmit={handleInviteUser}
                    className="flex items-center"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {inviteLoading ? "Sending..." : "Send Invite"}
                    </button>
                  </form>
                  {inviteError && (
                    <p className="text-red-500 mt-2 text-sm">{inviteError}</p>
                  )}
                  {inviteSuccess && (
                    <p className="text-green-500 mt-2 text-sm">
                      Invitation sent successfully!
                    </p>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-medium mb-3">
                  Members ({members.length})
                </h2>
                <div className="divide-y divide-gray-200">
                  {members.map((member: GroupMember) => (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.username}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-gray-500">
                              {member.username.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">
                            {member.username}
                            {member.id === user?.id && (
                              <span className="text-gray-500 text-sm ml-2">
                                (You)
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default GroupDetailPage;
