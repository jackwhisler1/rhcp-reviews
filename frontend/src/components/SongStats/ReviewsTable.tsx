import { SongStat, FiltersState } from "../../types/rhcp-types";

interface TableProps {
  songStats: SongStat[];
  filters: FiltersState;
  onReviewClick: (songId: number) => void;
}

const ReviewsTable = ({ songStats, filters, onReviewClick }: TableProps) => {
  const isGroupView = filters.groupId !== "all";
  const isUserView = filters.userId !== "all" || filters.showUserOnly;

  return (
    <table className="reviews-table">
      <thead>
        <tr>
          <th>Track</th>
          <th>Song Title</th>
          {!isUserView && <th>Public Avg</th>}
          {isGroupView && <th>Group Avg</th>}
          <th>{isUserView ? "Your Rating" : "Selected User"}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {songStats.map((song) => (
          <tr key={song.id}>
            <td>{song.trackNumber}</td>
            <td>{song.title}</td>

            {!isUserView && (
              <td className="public-avg">{song.averageRating.toFixed(1)}</td>
            )}

            {isGroupView && (
              <td className="group-avg">
                {(song.groupAverage || 0).toFixed(1)}
              </td>
            )}

            <td className="user-rating">
              {song.userRating?.toFixed(1) || "-"}
            </td>

            <td>
              <button
                className="view-reviews-btn"
                onClick={() => onReviewClick(song.id)}
              >
                View Reviews ({song.reviewCount})
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default ReviewsTable;
