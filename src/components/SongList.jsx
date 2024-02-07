import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import Song from './Song';
import '../styling/Styles.css' 
import BaseContainer from './Container';
import StadiumArcadium from './stadium-arcadium-rankings.json';
const SongList = () => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [songs, setSongs] = useState([]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSongs = [...songs].sort((a, b) => {
    const key = sortConfig.key;
  
    if (key === 'rating') {
      // Parse ratings as numbers for proper sorting
      const ratingA = parseFloat(a.averageRating);
      const ratingB = parseFloat(b.averageRating);
  
      if (sortConfig.direction === 'asc') {
        return ratingA > ratingB ? 1 : -1;
      } else if (sortConfig.direction === 'desc') {
        return ratingA < ratingB ? 1 : -1;
      }
    } else {
      // Sort other fields as strings
      if (sortConfig.direction === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      } else if (sortConfig.direction === 'desc') {
        return a[key] < b[key] ? 1 : -1;
      }
    }
  
    return 0;
  });
  
  useEffect(() => {
    const calculateAverageRating = (reviews) => {
      const sum = reviews.reduce((total, review) => total + review.rating, 0);
      return sum / reviews.length;
    };
  
    const songsWithAverageRating = StadiumArcadium.songs.map(song => ({
      ...song,
      averageRating: calculateAverageRating(song.reviews),
    }));
  
    setSongs(songsWithAverageRating);
  }, []);
  

  return (
    <BaseContainer>
      <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200 h-full overflow-y-auto">
        <header className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-red-700">Red Hot Takes</h2>
        </header>
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="table-auto w-full" style={{ caretColor: 'transparent' }}>
              <thead className="text-xs font-semibold uppercase text-gray-400 bg-gray-50">
                <tr>
                  <th className="p-2 whitespace-nowrap cursor-pointer text-red-700" onClick={() => handleSort('songName')}>
                    <div className="font-semibold text-left">Song</div>
                  </th>
                  <th className="p-2 whitespace-nowrap cursor-pointer text-red-700" onClick={() => handleSort('albumName')}>
                    <div className="font-semibold text-left">Album</div>
                  </th>
                  <th className="p-2 whitespace-nowrap cursor-pointer text-red-700" onClick={() => handleSort('rating')}>
                    <div className="font-semibold text-left">Rating</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {sortedSongs.map(song => (
                  <tr key={song.id}>
                    <td className="p-2 whitespace-nowrap">{song.songName}</td>
                    <td className="p-2 whitespace-nowrap">{song.albumName}</td>
                    <td className="p-2 whitespace-nowrap">{song.averageRating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default SongList;
