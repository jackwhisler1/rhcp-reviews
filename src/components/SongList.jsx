import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import Song from './Song';
import '../styling/Styles.css' 
import BaseContainer from './Container';
const SongList = () => {

  const getRandomRating = () => Math.floor(Math.random() * 5) + 1;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [songs] = useState([
    { id: 1, title: 'Dani California', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 1' },
    { id: 2, title: 'Snow (Hey Oh)', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 2' },
    { id: 3, title: 'Charlie', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 3' },
    { id: 4, title: 'Stadium Arcadium', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 4' },
    { id: 5, title: 'Hump de Bump', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 5' },
    { id: 6, title: 'She\'s Only 18', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 6' },
    { id: 7, title: 'Slow Cheetah', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 7' },
    { id: 8, title: 'Torture Me', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 8' },
    { id: 9, title: 'Strip My Mind', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 9' },
    { id: 10, title: 'Especially in Michigan', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 10' },
    { id: 11, title: 'Warlocks', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 11' },
    { id: 12, title: 'C\'mon Girl', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 12' },
    { id: 13, title: 'Wet Sand', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 13' },
    { id: 14, title: 'Hey', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 14' },
    { id: 15, title: 'Desecration Smile', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 15' },
    { id: 16, title: 'Tell Me Baby', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 16' },
    { id: 17, title: 'Hard to Concentrate', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 17' },
    { id: 18, title: '21st Century', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 18' },
    { id: 19, title: 'She Looks to Me', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 19' },
    { id: 20, title: 'Readymade', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 20' },
    { id: 21, title: 'If', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 21' },
    { id: 22, title: 'Make You Feel Better', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 22' },
    { id: 23, title: 'Animal Bar', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 23' },
    { id: 24, title: 'So Much I', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 24' },
    { id: 25, title: 'Storm in a Teacup', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 25' },
    { id: 26, title: 'We Believe', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 26' },
    { id: 27, title: 'Turn It Again', album: 'Stadium Arcadium', rating: getRandomRating(), userName: 'User 27' },   {
      id: 28,
      title: 'Death of a Martian',
      album: 'Stadium Arcadium',
      rating: getRandomRating(),
      userName: 'User 28',},]);
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSongs = songs.sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    } else if (sortConfig.direction === 'desc') {
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    }
    return 0;
  });


  return (
    <BaseContainer>
      <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200">
        <header className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Songs</h2>
        </header>
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="table-auto w-full"    style={{
            caretColor: 'transparent',  // For non-Firefox browsers
          }}>
   <thead className="text-xs font-semibold uppercase text-gray-400 bg-gray-50">
                <tr>
                  <th
                    className="p-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="font-semibold text-left">Title</div>
                  </th>
                  <th
                    className="p-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort('album')}
                  >
                    <div className="font-semibold text-left">Album</div>
                  </th>
                  <th
                    className="p-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="font-semibold text-left">Rating</div>
                  </th>
                  <th
                    className="p-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort('userName')}
                  >
                    <div className="font-semibold text-center">User Name</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
              {sortedSongs.map(song => (
                  <Song key={song.id} {...song} />
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
