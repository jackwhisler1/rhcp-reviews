import React, { useState, useEffect } from "react";
import BaseContainer from "../components/Container";
import AlbumCarousel from "../components/AlbumCarousel";
import SongStats from "../components/SongStats";
import Footer from "../components/Footer"; // Create a simple Footer component

const Home: React.FC = () => {
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [songStats, setSongStats] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [showUserOnly, setShowUserOnly] = useState(false);

  useEffect(() => {
    if (selectedAlbumId) {
      const fetchSongStats = async () => {
        try {
          const params = new URLSearchParams();
          if (selectedGroup !== "all") params.append("groupId", selectedGroup);
          if (showUserOnly) params.append("userFilter", "true");

          const response = await fetch(
            `http://localhost:5000/api/albums/${selectedAlbumId}/songs/stats?${params}`
          );
          const data = await response.json();
          setSongStats(data);
        } catch (error) {
          console.error("Error fetching song stats:", error);
        }
      };
      fetchSongStats();
    }
  }, [selectedAlbumId, selectedGroup, showUserOnly]);

  const handleFilterChange = (group: string, userOnly: boolean) => {
    setSelectedGroup(group);
    setShowUserOnly(userOnly);
  };

  return (
    <BaseContainer>
      <div className="w-full max-w-4xl mx-auto p-4">
        <AlbumCarousel
          onAlbumSelect={setSelectedAlbumId}
          selectedAlbumId={selectedAlbumId}
        />

        {selectedAlbumId && (
          <SongStats
            songStats={songStats}
            selectedAlbumId={selectedAlbumId}
            selectedGroup={selectedGroup}
            showUserOnly={showUserOnly}
            onFilterChange={handleFilterChange}
          />
        )}

        <Footer />
      </div>
    </BaseContainer>
  );
};

export default Home;
