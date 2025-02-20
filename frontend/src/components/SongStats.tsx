import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SongStat {
  id: number;
  title: string;
  trackNumber: number;
  duration: string;
  averageRating: number;
  reviewCount: number;
  userRating: number | null;
}

interface SongStatsProps {
  songStats: SongStat[];
  selectedAlbumId: number | null;
  selectedGroup: string;
  showUserOnly: boolean;
  onFilterChange: (group: string, userOnly: boolean) => void;
}

const SongStats: React.FC<SongStatsProps> = ({
  songStats,
  selectedAlbumId,
  selectedGroup,
  showUserOnly,
  onFilterChange,
}) => {
  const chartData = {
    labels: songStats.map((song) => song.title),
    datasets: [
      {
        label: "Average Rating",
        data: songStats.map((song) => song.averageRating),
        backgroundColor: "rgba(229, 62, 62, 0.6)",
      },
      {
        label: "Your Rating",
        data: songStats.map((song) => song.userRating || 0),
        backgroundColor: "rgba(34, 34, 34, 0.6)",
        hidden: !showUserOnly,
      },
    ],
  };

  return (
    <section>
      <div className="flex gap-4 mb-6">
        <select
          className="text-sm p-2 border rounded"
          value={selectedGroup}
          onChange={(e) => onFilterChange(e.target.value, showUserOnly)}
        >
          <option value="all">All Reviews</option>
        </select>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showUserOnly}
            onChange={(e) => onFilterChange(selectedGroup, e.target.checked)}
          />
          Show Only Your Ratings
        </label>
      </div>

      <div className="mb-8">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "top" },
              title: {
                display: true,
                text: `Song Ratings`,
              },
            },
            scales: {
              y: {
                max: 5,
                min: 0,
                ticks: { stepSize: 0.5 },
              },
            },
          }}
        />
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Track
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Song Title
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Average Rating
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Your Rating
            </th>
          </tr>
        </thead>
        <tbody>
          {songStats.map((song) => (
            <tr
              key={song.id}
              className="border-t border-gray-100 hover:bg-gray-50"
            >
              <td className="p-3">{song.trackNumber}</td>
              <td className="p-3 font-medium">{song.title}</td>
              <td className="p-3">
                {song.averageRating.toFixed(1)}
                <span className="text-gray-500 ml-2">({song.reviewCount})</span>
              </td>
              <td className="p-3">
                {song.userRating ? (
                  <span className="text-red-600 font-medium">
                    {song.userRating.toFixed(1)}
                  </span>
                ) : (
                  <button className="text-red-500 hover:text-red-700 text-sm">
                    Add Review
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default SongStats;
