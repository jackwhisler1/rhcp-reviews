import React from 'react';

const Song = ({ title, album, rating, userName }) => {
  return (
    <tr>
      <td>{title}</td>
      <td>{album}</td>
      <td>{rating}</td>
    </tr>
  );
};

export default Song;
