import React, { useMemo } from "react";
import ApexChart from "react-apexcharts";
import { SongStat, FiltersState } from "../../types/rhcp-types";
import { ApexOptions } from "apexcharts";

interface ChartProps {
  albumTitle: string;
  songStats: SongStat[];
  filters: FiltersState;
}
const ChartComponent = React.memo(
  ({ albumTitle, songStats, filters }: ChartProps) => {
    const isGroupView = filters.groupId !== "all";
    const isUserView = filters.userId !== "all" || filters.showUserOnly;

    // Process the data in a useMemo to prevent unnecessary recalculations
    const { series, categories } = useMemo(() => {
      // Sort songs by track number for consistent display
      const sortedSongs = [...songStats].sort(
        (a, b) => a.trackNumber - b.trackNumber
      );

      // Extract song titles for x-axis
      // Include track number for better identification
      const categories = sortedSongs.map((song) => {
        // Format: "1. Song Title"
        return `${song.trackNumber}. ${song.title}`;
      });

      // Always include public average ratings
      const publicSeries = {
        name: "Public Average",
        data: sortedSongs.map((song) =>
          typeof song.publicAverage === "number"
            ? parseFloat(song.publicAverage.toFixed(1))
            : null
        ),
        color: "#E53E3E",
      };

      // Conditionally include group ratings if we're in group view
      const groupSeries = isGroupView
        ? {
            name: "Group Average",
            data: sortedSongs.map((song) =>
              typeof song.groupAverage === "number"
                ? parseFloat(song.groupAverage.toFixed(1))
                : null
            ),
            color: "#ECC94B",
          }
        : null;

      // Always include user ratings (will show as null if not available)
      const userSeries = {
        name: isUserView ? "Your Ratings" : "Selected User",
        data: sortedSongs.map((song) =>
          typeof song.userRating === "number"
            ? parseFloat(song.userRating.toFixed(1))
            : null
        ),
        color: "#2B6CB0",
      };

      // Build the final series array with only the applicable series
      const seriesArray = [publicSeries];
      if (groupSeries) seriesArray.push(groupSeries);
      seriesArray.push(userSeries);

      return { series: seriesArray, categories };
    }, [songStats, isGroupView, isUserView, filters]);

    // Calculate dynamic height based on number of songs
    const chartHeight = useMemo(() => {
      // Base height is 450px, but increases with more songs
      const baseHeight = 450;

      // Add height based on number of songs
      const adjustedHeight = Math.max(
        baseHeight,
        baseHeight + (songStats.length - 10) * 15
      );

      return adjustedHeight;
    }, [songStats.length]);

    // Calculate dynamic width based on number of songs to ensure all fit
    const chartWidth = useMemo(() => {
      // Each song needs roughly 50-60px width + margins
      // We calculate a dynamic width based on the number of songs
      // with a minimum of 100% to fill container
      const minWidth = Math.max(100, songStats.length * 50);

      // Return as percentage string for responsive sizing
      return `100%`;
    }, [songStats.length]);

    // Configure chart options
    const options: ApexOptions = {
      chart: {
        id: "album-stats-chart",
        type: "bar",
        height: chartHeight,
        fontFamily: "Inter, system-ui, sans-serif",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          speed: 400,
          dynamicAnimation: {
            enabled: true,
            speed: 250,
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: "darken",
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: songStats.length > 15 ? "85%" : "60%", // Thinner bars for many songs
          borderRadius: 3,
          dataLabels: {
            position: "top",
          },
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
        categories,
        labels: {
          rotate: songStats.length > 10 ? -45 : 0, // Only rotate for many songs
          rotateAlways: songStats.length > 10,
          style: {
            fontSize: songStats.length > 15 ? "10px" : "11px", // Smaller font for many songs
            fontWeight: 500,
          },
          hideOverlappingLabels: false,
          trim: songStats.length > 20, // Only trim for very many songs
          minHeight: 60,
          maxHeight: 120,
        },
        axisBorder: {
          show: true,
        },
        axisTicks: {
          show: true,
        },
        tickAmount: songStats.length > 20 ? undefined : songStats.length, // Control tick amount
        tickPlacement: "on",
      },
      yaxis: {
        min: 0,
        max: 10,
        tickAmount: 5,
        forceNiceScale: true,
        title: {
          text: "Rating",
          style: {
            fontSize: "13px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (value) =>
            value % 1 === 0 ? value.toString() : value.toFixed(1),
        },
      },
      fill: {
        opacity: 0.85,
      },
      tooltip: {
        y: {
          formatter: (val) =>
            val !== null && val !== undefined ? val.toFixed(1) : "No rating",
        },
        shared: true,
        intersect: false,
        // Enhanced tooltip to show full song title
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const songTitle = songStats[dataPointIndex]?.title || "";
          const rating = series[seriesIndex][dataPointIndex];
          const formattedRating =
            rating !== null && rating !== undefined
              ? rating.toFixed(1)
              : "No rating";
          const seriesName = w.globals.seriesNames[seriesIndex];

          return `<div class="arrow_box"> <div class="apexcharts-tooltip-title" style="font-weight: bold; margin-bottom: 5px; font-size: 13px;">
                  ${songTitle} 
                </div><span class="apexcharts-tooltip-text-y-label">${seriesName}: </span>
                    <span class="apexcharts-tooltip-text-y-value">${formattedRating}</span>
                <div class="apexcharts-tooltip-series-group">
                  <span class="apexcharts-tooltip-marker" style="background-color: ${w.globals.colors[seriesIndex]}"></span>
                  <div>
                   
                  </div>
                </div></div>`;
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontSize: "13px",
        markers: {
          size: 12,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 0,
        },
      },
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 3,
        padding: {
          bottom: songStats.length > 10 ? 20 : 10, // More padding for rotated labels
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            plotOptions: {
              bar: {
                columnWidth: "85%",
              },
            },
            legend: {
              position: "bottom",
              horizontalAlign: "center",
            },
            xaxis: {
              labels: {
                rotate: -45, // Always rotate on mobile
                rotateAlways: true,
                style: {
                  fontSize: "10px",
                },
              },
            },
          },
        },
      ],
    };

    if (!songStats || songStats.length === 0) {
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

    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h4 className="text-gray-700 text-lg font-semibold mb-4">
          {albumTitle ? `${albumTitle} Ratings` : "Select an Album"}
        </h4>
        <div className="chart-container w-full">
          <ApexChart
            options={options}
            series={series}
            type="bar"
            height={chartHeight}
            width="100%"
          />
        </div>
      </div>
    );
  }
);

export default ChartComponent;
