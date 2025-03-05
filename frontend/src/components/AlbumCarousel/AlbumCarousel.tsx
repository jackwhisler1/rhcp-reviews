import React, { useEffect, useState } from "react";

interface Album {
  id: number;
  title: string;
  artworkUrl: string;
  releaseDate: string;
}

interface AlbumCarouselProps {
  onAlbumSelect: (albumId: number) => void;
  selectedAlbumId: number | null;
}

const AlbumCarousel: React.FC<AlbumCarouselProps> = ({
  onAlbumSelect,
  selectedAlbumId,
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/albums");
        const data = await response.json();
        setAlbums(data.data);
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">RHCP Albums</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {albums?.map((album) => (
          <div
            key={album.id}
            className={`flex-shrink-0 w-32 cursor-pointer transition-transform ${
              selectedAlbumId === album.id
                ? "ring-2 ring-red-500 rounded-lg"
                : ""
            }`}
            onClick={() => onAlbumSelect(album.id)}
          >
            <img
              src={album.artworkUrl}
              alt={album.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <p className="text-xs text-center mt-2 font-medium">
              {album.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumCarousel;
