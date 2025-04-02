import { useState } from "react";
import { FiltersState, Group } from "../../types/rhcp-types";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import ReviewsTable from "./ReviewsTable";
import Filters from "./Filters";
import ChartComponent from "./ChartComponent";
import { useAlbumStats } from "../../hooks/useAlbumStats";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { useAuth } from "../../context/AuthContext";

interface SongStatsProps {
  albumId: number;
  albumTitle: string;
  userId?: string;
  groups: Group[];
}

const SongStats = ({
  albumId,
  albumTitle,
  userId,
  groups = [],
}: SongStatsProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all", // Always start with public view
    userId: userId || "all",
    showUserOnly: false,
  });

  const handleReviewSubmitted = () => {
    refreshStats();
  };

  const { stats, loading, error, refreshStats } = useAlbumStats(
    albumId,
    filters
  );

  const { members, loading: membersLoading } = useGroupMembers(filters.groupId);

  const handleFilterChange = (newFilters: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) return <LoadingSpinner />;

  // Show error if there is one
  if (error) {
    // If it's a forbidden error for group access, show a login prompt
    if (error.includes("Forbidden") && filters.groupId !== "all") {
      return (
        <div className="song-stats-container my-4 p-6 bg-white rounded-lg shadow-md">
          <Filters
            groups={groups}
            members={members}
            filters={filters}
            loadingMembers={membersLoading}
            onFilterChange={handleFilterChange}
          />

          <div className="my-6 p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Group Access Required
            </h3>
            <p className="text-yellow-700 mb-4">
              You need to be logged in and a member of this group to view these
              ratings.
            </p>
            <div className="flex justify-center">
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log In
              </a>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, groupId: "all" }))
                }
                className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Public Ratings
              </button>
            </div>
          </div>
        </div>
      );
    }

    // For other errors, show the standard error message
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="song-stats-container my-4 p-6 bg-white rounded-lg shadow-md">
      <Filters
        groups={groups}
        members={members}
        filters={filters}
        onFilterChange={handleFilterChange}
        loadingMembers={membersLoading}
      />

      <ChartComponent
        albumTitle={albumTitle}
        songStats={stats}
        filters={filters}
      />

      <ReviewsTable
        songStats={stats}
        filters={filters}
        albumId={albumId}
        onReviewSubmitted={refreshStats}
      />
    </div>
  );
};

export default SongStats;
