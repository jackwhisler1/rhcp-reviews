import React, { useState, useEffect } from "react";
import "../styling/Styles.css";
import BaseContainer from "./Container";

interface Review {
  rating: number;
}

interface Song {
  id: number;
  title: string; // Changed from songName to match backend
  trackNumber: number;
  duration: string;
  reviews: Review[];
  album: {
    // Added nested album object
    title: string;
    artworkUrl: string;
  };
  averageRating?: number;
}

interface SortConfig {
  key: keyof Song | null;
  direction: "asc" | "desc";
}

const SongList: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/songs");
        const result = await response.json();

        const allSongs = result.data;
        setSongs(allSongs);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    fetchSongs();
  }, []);

  return (
    <BaseContainer>
      <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-sm border-gray-200 h-full overflow-y-auto">
        <header className="px-5 py-4 border-b border-gray-100 sticky top-0 z-50 bg-white text-xl">
          <h2 className="text-s font-semibold text-red-700">Red Hot Takes</h2>
        </header>
        <div className="p-3">
          <table
            className="table-auto w-full"
            style={{ caretColor: "transparent" }}
          >
            <thead className="text-s font-semibold uppercase text-gray-400 bg-gray-50">
              <tr>
                <th className="p-2 whitespace-nowrap cursor-pointer text-red-700">
                  <div className="font-semibold text-left">Song</div>
                </th>
                <th className="p-2 whitespace-nowrap text-red-700">Album</th>
                <th className="p-2 whitespace-nowrap cursor-pointer text-red-700">
                  <div className="font-semibold text-left">Rating</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {songs.map((song) => (
                <tr key={song.id}>
                  <td className="p-2 whitespace-nowrap">{song.title}</td>{" "}
                  <td className="p-2">
                    <img
                      src={song.album.artworkUrl}
                      alt="Album Artwork"
                      className="w-8 h-8"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {song.averageRating?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BaseContainer>
  );
};

export default SongList;
