import { useState, useCallback, useEffect } from "react";
import {
  Album,
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
import AlbumCarousel from "../AlbumCarousel/AlbumCarousel";
import { useAlbumStats } from "../../hooks/useAlbumStats";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { useAuth } from "../../context/AuthContext";

const SongStats = ({
  albumId,
  albumTitle,
  userId,
  groups = [],
  selectedUserId,
  selectedUserName,
}: SongStatsProps) => {
  const { user } = useAuth();
  const [localStats, setLocalStats] = useState<SongStat[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>({
    id: albumId,
    title: albumTitle,
    artworkUrl: "",
    releaseDate: "",
  });

  // State hooks
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all",
    userId: userId || "all",
    selectedUserId: selectedUserId || "all",
    selectedUserName: selectedUserName || "user",
  });
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Derived values
  const effectiveAlbumId = selectedAlbum?.id || albumId;
  const { stats, loading, error } = useAlbumStats(effectiveAlbumId, filters);
  const { members, loading: membersLoading } = useGroupMembers(filters.groupId);

  // Sync local stats with API data
  useEffect(() => {
    if (stats.length > 0) {
      setLocalStats(stats);
    }
  }, [stats]);

  // Album fetching
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/albums");
        const data = await response.json();

        if (data.data?.length > 0) {
          setAlbums(data.data);
          const matchingAlbum = albumId
            ? data.data.find((a: Album) => a.id === albumId)
            : data.data[0];
          if (matchingAlbum) setSelectedAlbum(matchingAlbum);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };
    fetchAlbums();
  }, [albumId]);

  // Responsive layout
  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Review submission handler
  const handleReviewSubmitted = useCallback((updatedSong?: SongStat) => {
    if (updatedSong) {
      setLocalStats((prev) =>
        prev.map((song) =>
          song.id === updatedSong.id ? { ...song, ...updatedSong } : song
        )
      );
    }
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltersState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Album selection handler
  const handleAlbumSelect = useCallback(
    (album: { id: number; title: string }) => {
      setSelectedAlbum((prev) => ({
        ...prev,
        id: album.id,
        title: album.title,
      }));

      const url = new URL(window.location.href);
      url.searchParams.set("albumId", album.id.toString());
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="song-stats-container my-4 bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <Filters
          groups={groups}
          members={members}
          filters={filters}
          onFilterChange={handleFilterChange}
          loadingMembers={membersLoading}
          currentUserId={userId}
        />
      </div>

      {isLargeScreen ? (
        <div className="flex flex-row">
          <div className="w-1/4 p-4 border-r border-gray-200">
            <AlbumCarousel
              onAlbumSelect={handleAlbumSelect}
              selectedAlbumId={selectedAlbum?.id}
              layout="vertical"
            />
          </div>
          <div className="w-3/4 p-4">
            <ChartComponent
              albumTitle={selectedAlbum?.title || "Album"}
              songStats={localStats}
              filters={filters}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="w-full p-4">
            <AlbumCarousel
              onAlbumSelect={handleAlbumSelect}
              selectedAlbumId={selectedAlbum?.id}
              layout="horizontal"
            />
          </div>
          <div className="w-full p-4">
            <ChartComponent
              albumTitle={selectedAlbum?.title || "Album"}
              songStats={localStats}
              filters={filters}
            />
          </div>
        </div>
      )}

      <div className="w-full p-4">
        <ReviewsTable
          songStats={localStats}
          filters={filters}
          albumId={effectiveAlbumId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

export default SongStats;
