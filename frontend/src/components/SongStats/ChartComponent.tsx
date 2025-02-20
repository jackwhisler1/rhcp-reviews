import { Bar } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import { SongStat, FiltersState } from "../../types/rhcp-types";

interface ChartProps {
  songStats: SongStat[];
  filters: FiltersState;
}

const ChartComponent = ({ songStats, filters }: ChartProps) => {
  const isGroupView = filters.groupId !== "all";
  const isUserView = filters.userId !== "all" || filters.showUserOnly;

  const chartData = {
    labels: songStats.map((song) => song.title),
    datasets: [
      {
        label: "Public Average",
        data: songStats.map((song) => song.averageRating),
        hidden: isUserView,
        backgroundColor: "rgba(229, 62, 62, 0.6)",
      },
      ...(isGroupView
        ? [
            {
              label: "Group Average",
              data: songStats.map((song) => song.groupAverage || 0),
              hidden: isUserView,
              backgroundColor: "rgba(255, 206, 86, 0.6)",
            },
          ]
        : []),
      {
        label: isUserView ? "Your Ratings" : "Selected User Ratings",
        data: songStats.map(
          (song) =>
            song.userReviews?.find((r) => r.id.toString() === filters.userId)
              ?.rating || 0
        ),
        backgroundColor: "rgba(34, 34, 34, 0.6)",
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const song = songStats[context.dataIndex];
            return [
              `Public Avg: ${song.averageRating.toFixed(1)}`,
              ...(isGroupView
                ? [`Group Avg: ${song.groupAverage?.toFixed(1) || "-"}`]
                : []),
              `Your Rating: ${song.userRating?.toFixed(1) || "-"}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        max: 10,
        min: 0,
        ticks: { stepSize: 1 },
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};
export default ChartComponent;
