import { useState, useEffect } from "react";
import BaseContainer from "../components/common/Container";
import SongStats from "../components/SongStats/SongStats";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useUserGroups } from ".././hooks/useUserGroups";
import Navbar from "../components/common/Navbar";
import MyProfile from "../components/Profile/MyProfile";

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

  // Check for album ID in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const albumIdParam = params.get("albumId");

    if (albumIdParam && !selectedAlbum.id) {
      // Fetch album details if we have an ID in URL
      const fetchAlbumDetails = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/albums/${albumIdParam}`
          );
          if (response.ok) {
            const album = await response.json();
            setSelectedAlbum({
              id: parseInt(albumIdParam),
              title: album.title || "Album",
            });
          }
        } catch (error) {
          console.error("Error fetching album details:", error);
        }
      };

      fetchAlbumDetails();
    } else if (!selectedAlbum.id) {
      // Default to first album if none selected
      const fetchFirstAlbum = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/albums");
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const firstAlbum = data.data[0];
            setSelectedAlbum({
              id: firstAlbum.id,
              title: firstAlbum.title,
            });
          }
        } catch (error) {
          console.error("Error fetching albums:", error);
        }
      };

      fetchFirstAlbum();
    }
  }, [selectedAlbum.id]);

  // Update URL when album changes
  useEffect(() => {
    if (selectedAlbum.id) {
      const url = new URL(window.location.href);
      url.searchParams.set("albumId", selectedAlbum.id.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedAlbum.id]);

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
              <MyProfile />
            )}

            <Footer />
          </div>
        </div>
      </BaseContainer>
    </>
  );
};

export default HomePage;
