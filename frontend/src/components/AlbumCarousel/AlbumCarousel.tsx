import React, { useEffect, useState } from "react";
import { Album } from "../../types/rhcp-types";

interface AlbumCarouselProps {
  onAlbumSelect: (album: { id: number; title: string }) => void;
  selectedAlbumId: number | null;
  layout?: "horizontal" | "vertical" | "auto";
}

const AlbumCarousel: React.FC<AlbumCarouselProps> = ({
  onAlbumSelect,
  selectedAlbumId,
  layout = "auto",
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Fetch albums
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

  // Determine actual layout
  const actualLayout =
    layout === "auto" ? (isLargeScreen ? "vertical" : "horizontal") : layout;

  // Modified class for vertical layout to match chart height
  const verticalContainerClass =
    "flex flex-col gap-2 h-[600px] overflow-y-auto pr-2 custom-scrollbar";

  const horizontalContainerClass = "flex gap-4 overflow-x-auto pb-4";

  return (
    <div className={`select-none ${actualLayout === "vertical" ? "" : "mb-4"}`}>
      <h2 className="text-lg font-bold mb-3">RHCP Albums</h2>

      <div
        className={
          actualLayout === "vertical"
            ? verticalContainerClass
            : horizontalContainerClass
        }
      >
        {albums?.map((album) => (
          <div
            key={album.id}
            className={`
              cursor-pointer transition-all 
              ${
                selectedAlbumId === album.id
                  ? "border-2 border-imperial-red rounded-lg"
                  : "border border-gray-200 hover:border-gray-300"
              }
              ${
                actualLayout === "vertical"
                  ? "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  : "flex-shrink-0 w-28 m-1 hover:translate-y-[-5px] rounded-lg"
              }
            `}
            onClick={() => onAlbumSelect({ id: album.id, title: album.title })}
          >
            <img
              src={album.artworkUrl}
              alt={album.title}
              className={
                actualLayout === "vertical"
                  ? "w-12 h-12 object-cover rounded-md flex-shrink-0"
                  : "w-full h-28 object-cover rounded-t-lg"
              }
            />
            <p
              className={
                actualLayout === "vertical"
                  ? "text-xs font-medium flex-grow line-clamp-2"
                  : "text-xs text-center p-2 font-medium truncate"
              }
            >
              {album.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumCarousel;
