// ReviewRow.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat } from "../../types/rhcp-types";
import CommentInput from "./CommentInput";
import RatingComponent from "./RatingComponent";

interface ReviewRowProps {
  song: SongStat;
  isUserView: boolean;
  isGroupView: boolean;
  isAuthenticated: boolean;
  expandedSongId: number | null;
  currentRatings: { [key: number]: number };
  reviewContents: { [key: number]: string };
  submitting: { [key: number]: boolean };
  successMessages: { [key: number]: string };
  editingComments: { [key: number]: boolean };
  handleExpand: (songId: number) => void;
  handleRatingChange: (songId: number, rating: number) => void;
  handleContentChange: (songId: number, content: string) => void;
}

const ReviewRow: React.FC<ReviewRowProps> = ({
  song,
  isUserView,
  isGroupView,
  isAuthenticated,
  expandedSongId,
  currentRatings,
  reviewContents,
  submitting,
  successMessages,
  editingComments,
  handleExpand,
  handleRatingChange,
  handleContentChange,
}) => {
  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${
        expandedSongId === song.id ? "bg-gray-50" : ""
      }`}
    >
      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
        {song.trackNumber}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900">
        {song.title}
      </td>

      {!isUserView && (
        <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 text-right">
          {song.averageRating.toFixed(1)}
        </td>
      )}

      {isGroupView && (
        <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 text-right">
          {(song.groupAverage || 0).toFixed(1)}
        </td>
      )}

      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700">
        {isAuthenticated ? (
          <RatingComponent
            songId={song.id}
            currentRating={currentRatings[song.id]}
            userRating={song.userRating}
            submitting={submitting[song.id]}
            successMessage={successMessages[song.id]}
            handleRatingChange={handleRatingChange}
          />
        ) : (
          <div className="text-center">
            {song.userRating?.toFixed(1) || "-"}
          </div>
        )}
      </td>

      {isAuthenticated && (
        <td className="px-3 py-2 text-sm">
          <CommentInput
            songId={song.id}
            content={reviewContents[song.id] || ""}
            isEditing={editingComments[song.id]}
            handleContentChange={handleContentChange}
          />
        </td>
      )}

      <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
        <button
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm ${
            expandedSongId === song.id
              ? "bg-indigo-100 text-indigo-700"
              : "bg-white-smoke"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors`}
          onClick={() => handleExpand(song.id)}
        >
          {expandedSongId === song.id
            ? "Hide Reviews"
            : `View Reviews (${song.reviewCount})`}
        </button>
      </td>
    </tr>
  );
};

export default React.memo(ReviewRow);
