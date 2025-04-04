import { useState, useCallback, useRef } from "react";
import {
  FiltersState,
  Group,
  SongStat,
  SongStatsProps,
} from "../../types/rhcp-types";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import ReviewsTable from "./ReviewsTable";
import Filters from "./Filters";
import ChartComponent from "./ChartComponent";
import { useAlbumStats } from "../../hooks/useAlbumStats";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { useAuth } from "../../context/AuthContext";

const SongStats = ({
  albumId,
  albumTitle,
  userId,
  groups = [],
}: SongStatsProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all",
    userId: userId || "all",
    showUserOnly: false,
  });

  // Use a ref for the stable key
  const tableKey = useRef("reviews-table");
  const chartKey = useRef("chart-component");

  // Instead of refreshing the whole stats, we'll do a targeted update
  const [reviewUpdateCount, setReviewUpdateCount] = useState(0);

  const { stats, loading, error, refreshStats } = useAlbumStats(
    albumId,
    filters,
    reviewUpdateCount // Pass this to useAlbumStats to trigger refresh
  );

  const { members, loading: membersLoading } = useGroupMembers(filters.groupId);

  // This function only increments the counter to trigger a refresh
  const handleReviewSubmitted = useCallback(() => {
    setReviewUpdateCount((prev) => prev + 1);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltersState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Rest of your component...

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
        key={chartKey.current}
        albumTitle={albumTitle}
        songStats={stats}
        filters={filters}
      />

      <ReviewsTable
        key={tableKey.current}
        songStats={stats}
        filters={filters}
        albumId={albumId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default SongStats;
