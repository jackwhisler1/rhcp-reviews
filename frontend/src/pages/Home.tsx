import { useState } from "react";
import BaseContainer from "../components/common/Container";
import AlbumCarousel from "../components/AlbumCarousel/AlbumCarousel";
import SongStats from "../components/SongStats/SongStats";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useUserGroups } from ".././hooks/useUserGroups";

const HomePage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useUserGroups(user?.id);

  return (
    <BaseContainer>
      <div className="w-full max-w-4xl mx-auto p-4">
        <AlbumCarousel
          onAlbumSelect={setSelectedAlbumId}
          selectedAlbumId={selectedAlbumId}
        />

        {groupsLoading ? (
          <LoadingSpinner />
        ) : groupsError ? (
          <div className="text-red-600">
            Error loading groups: {groupsError}
          </div>
        ) : (
          selectedAlbumId && (
            <SongStats
              albumId={selectedAlbumId}
              userId={user?.id?.toString() || ""}
              groups={groups || []}
            />
          )
        )}

        <Footer />
      </div>
    </BaseContainer>
  );
};

export default HomePage;
