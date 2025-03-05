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
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm select-none">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              #
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              Song
            </th>
            {!isUserView && (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Public Avg
              </th>
            )}
            {isGroupView && (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Group Avg
              </th>
            )}
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              {isUserView ? "Your Rating" : "Selected User"}
            </th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {songStats.map((song) => (
            <tr key={song.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                {song.trackNumber}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                {song.title}
              </td>

              {!isUserView && (
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                  {song.averageRating.toFixed(1)}
                </td>
              )}

              {isGroupView && (
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                  {(song.groupAverage || 0).toFixed(1)}
                </td>
              )}

              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 text-right">
                {song.userRating?.toFixed(1) || "-"}
              </td>

              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                <button
                  className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm bg-white-smoke focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2  transition-colors"
                  onClick={() => onReviewClick(song.id)}
                >
                  View Reviews ({song.reviewCount})
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default ReviewsTable;
