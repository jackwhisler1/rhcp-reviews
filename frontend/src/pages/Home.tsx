import { useState, useEffect } from "react";
import BaseContainer from "../components/common/Container";
import SongStats from "../components/SongStats/SongStats";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useUserGroups } from ".././hooks/useUserGroups";
import Navbar from "../components/common/Navbar";

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: number | null;
    title: string;
  }>({
    id: null,
    title: "",
  });

  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useUserGroups(user?.id);

  return (
    <>
      <BaseContainer>
        <div className="flex flex-col bg-white items-center justify-center px-4">
          <Navbar />
          <div className="w-full max-w-7xl mx-auto p-4 bg-white">
            {groupsLoading || authLoading ? (
              <LoadingSpinner />
            ) : groupsError ? (
              <div className="text-red-600">
                Error loading groups: {groupsError}
              </div>
            ) : (
              <SongStats
                albumId={selectedAlbum.id ?? 0}
                albumTitle={selectedAlbum.title}
                userId={user?.id?.toString() || ""}
                groups={groups || []}
              />
            )}

            <Footer />
          </div>
        </div>
      </BaseContainer>
    </>
  );
};

export default HomePage;
