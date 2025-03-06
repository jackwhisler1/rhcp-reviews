import ApexChart from "react-apexcharts";
import { SongStat, FiltersState } from "../../types/rhcp-types";
import { ApexOptions } from "apexcharts";

interface ChartProps {
  albumTitle: string;
  songStats: SongStat[];
  filters: FiltersState;
}

const ChartComponent = ({ albumTitle, songStats, filters }: ChartProps) => {
  const isGroupView = filters.groupId !== "all";
  const isUserView = filters.userId !== "all" || filters.showUserOnly;

  const series = [
    {
      name: "Public Average",
      data: songStats.map((song) => ({
        x: song.title,
        y: song.averageRating,
      })),
      color: "#E53E3E",
    },
    ...(isGroupView
      ? [
          {
            name: "Group Average",
            data: songStats.map((song) => ({
              x: song.title,
              y: song.groupAverage || 0,
            })),
            color: "#ECC94B",
          },
        ]
      : []),
    {
      name: isUserView ? "Your Ratings" : "Selected User Ratings",
      data: songStats.map((song) => ({
        x: song.title,
        y:
          song.userReviews?.find((r) => r.id.toString() === filters.userId)
            ?.rating || 0,
      })),
      color: "#2D3748",
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: songStats.map((song) => song.title),
      labels: {
        trim: true,
        rotate: -45,
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      max: 10,
      min: 0,
      forceNiceScale: true,
      title: {
        text: "Rating",
      },
      labels: {
        formatter: (value: number) => value.toFixed(1),
      },
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const song = songStats[dataPointIndex];
        if (!songStats?.length) {
          return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h4 className="text-gray-700 text-lg font-semibold mb-4">
                {albumTitle ? `${albumTitle} Ratings` : "Select an Album"}
              </h4>
              <div className="text-gray-500 text-center py-8">
                No rating data available
              </div>
            </div>
          );
        }
        return `
          <div class="apexcharts-tooltip-box">
            <div class="text-lg font-semibold">${song.title}</div>
            <div class="flex flex-col gap-1 mt-2">
              <div class="text-red-600">Public Avg: ${song.averageRating.toFixed(
                1
              )}</div>
              ${
                isGroupView
                  ? `<div class="text-yellow-600">Group Avg: ${
                      song.groupAverage?.toFixed(1) || "-"
                    }</div>`
                  : ""
              }
              <div class="text-gray-800">Your Rating: ${
                song.userRating?.toFixed(1) || "-"
              }</div>
            </div>
          </div>
        `;
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      markers: {
        size: 12,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "70%",
            },
          },
          xaxis: {
            labels: {
              rotate: -35,
            },
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h4 className="text-gray-700 text-lg font-semibold mb-4">
        {" "}
        {albumTitle ? `${albumTitle} Ratings` : "Select an Album"}
      </h4>
      <ApexChart options={options} series={series} type="bar" height={450} />
    </div>
  );
};

export default ChartComponent;
