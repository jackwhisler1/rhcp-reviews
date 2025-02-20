import React from "react";

interface SongProps {
  title: string;
  album: string;
  rating: number;
  userName: string;
}

const Song: React.FC<SongProps> = ({ title, album, rating, userName }) => {
  return (
    <tr>
      <td>{title}</td>
      <td>{album}</td>
      <td>{rating}</td>
    </tr>
  );
};

export default Song;
