// CommentInput.tsx
import React from "react";

interface CommentInputProps {
  songId: number;
  content: string;
  isEditing: boolean;
  handleContentChange: (songId: number, content: string) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  songId,
  content,
  isEditing,
  handleContentChange,
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        value={content}
        onChange={(e) => handleContentChange(songId, e.target.value)}
        placeholder="Add a comment"
        className="w-full border-gray-300 rounded-sm text-sm p-1 focus:border-indigo-500 focus:ring-indigo-500 placeholder:text-gray-300 placeholder:italic"
      />
      {isEditing && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-pulse h-2 w-2 rounded-full bg-indigo-500"></div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CommentInput);
