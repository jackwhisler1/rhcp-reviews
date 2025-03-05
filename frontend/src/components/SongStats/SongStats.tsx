import { useState } from "react";
import { FiltersState, Group } from "../../types/rhcp-types";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import ReviewsTable from "./ReviewsTable";
import Filters from "./Filters";
import ChartComponent from "./ChartComponent";
import { useAlbumStats } from "../../hooks/useAlbumStats";
import { useGroupMembers } from "../../hooks/useGroupMembers";

interface SongStatsProps {
  albumId: number;
  userId: string;
  groups: Group[];
}

const SongStats = ({ albumId, userId, groups }: SongStatsProps) => {
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all",
    userId: "all",
    showUserOnly: false,
  });

  const { stats, loading, error } = useAlbumStats(albumId, filters);
  const { members } = useGroupMembers(filters.groupId);

  const handleFilterChange = (newFilters: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleReviewClick = (songId: number) => {
    // Implement review modal logic
    console.log("View reviews for song:", songId);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="song-stats-container my-4 p-6 bg-white rounded-lg shadow-md">
      <Filters
        groups={groups}
        members={members}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <ChartComponent songStats={stats} filters={filters} />

      <ReviewsTable
        songStats={stats}
        filters={filters}
        onReviewClick={handleReviewClick}
      />
    </div>
  );
};
export default SongStats;
