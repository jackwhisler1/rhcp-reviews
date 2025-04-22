import { useState, useCallback, useRef, useEffect } from "react";
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
}: SongStatsProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all",
    userId: userId || "all",
    showUserOnly: false,
  });

  // Initialize selectedAlbum with the passed-in albumId and albumTitle
  const [selectedAlbum, setSelectedAlbum] = useState<Album>({
    id: albumId,
    title: albumTitle,
    artworkUrl: "", // This will be updated when albums are fetched
    releaseDate: "",
  });

  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Fetch albums to get complete album data including artwork
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/albums");
        const data = await response.json();

        // Set the albums
        if (data.data && data.data.length > 0) {
          setAlbums(data.data);

          // If we already have an albumId, find that album's complete data
          if (albumId) {
            const matchingAlbum = data.data.find(
              (a: Album) => a.id === albumId
            );
            if (matchingAlbum) {
              setSelectedAlbum(matchingAlbum);
            }
          }
          // Otherwise use the first album by default
          else if (data.data.length > 0) {
            setSelectedAlbum(data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };
    fetchAlbums();
  }, [albumId]);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Instead of refreshing the whole stats, we'll do a targeted update
  const [reviewUpdateCount, setReviewUpdateCount] = useState(0);

  // Ensure we have a valid album ID for stats
  const effectiveAlbumId = selectedAlbum?.id || albumId;

  const { stats, loading, error, refreshStats } = useAlbumStats(
    effectiveAlbumId,
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

  // Handle album selection
  const handleAlbumSelect = useCallback(
    (album: { id: number; title: string }) => {
      setSelectedAlbum((prev) => ({
        ...prev,
        id: album.id,
        title: album.title,
      }));

      // Update URL to reflect selected album (without page reload)
      if (window.history && window.location.pathname) {
        const url = new URL(window.location.href);
        url.searchParams.set("albumId", album.id.toString());
        window.history.replaceState({}, "", url.toString());
      }
    },
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="song-stats-container my-4 bg-white rounded-lg shadow-md">
      {/* Filters at the top are always displayed horizontally */}
      <div className="p-4 border-b border-gray-200">
        <Filters
          groups={groups}
          members={members}
          filters={filters}
          onFilterChange={handleFilterChange}
          loadingMembers={membersLoading}
        />
      </div>

      {/* Chart section with side-by-side albums on large screens */}
      {isLargeScreen ? (
        <div className="flex flex-row">
          {/* Album carousel - vertical on large screens, takes up height of chart only */}
          <div className="w-1/4 p-4 border-r border-gray-200">
            <AlbumCarousel
              onAlbumSelect={handleAlbumSelect}
              selectedAlbumId={selectedAlbum?.id}
              layout="vertical"
            />
          </div>

          {/* Chart only in the right section */}
          <div className="w-3/4 p-4">
            <ChartComponent
              albumTitle={selectedAlbum?.title || "Album"}
              songStats={stats}
              filters={filters}
            />
          </div>
        </div>
      ) : (
        /* On small screens, horizontal album carousel followed by chart */
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
              songStats={stats}
              filters={filters}
            />
          </div>
        </div>
      )}

      {/* Reviews table takes full width regardless of screen size */}
      <div className="w-full p-4">
        <ReviewsTable
          songStats={stats}
          filters={filters}
          albumId={effectiveAlbumId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

export default SongStats;
