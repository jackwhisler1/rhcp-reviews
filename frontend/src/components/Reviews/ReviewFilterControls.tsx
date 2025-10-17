// components/reviews/ReviewFilterControls.tsx
import React, { useState } from "react";
import { ReviewFilters } from "../../types/review";
import { useUserGroups } from "../../hooks/useUserGroups";

interface ReviewFilterControlsProps {
  onFilterChange: (filters: ReviewFilters) => void;
}

export const ReviewFilterControls: React.FC<ReviewFilterControlsProps> = ({
  onFilterChange,
}) => {
  const { groups } = useUserGroups();
  const [filters, setFilters] = useState<ReviewFilters>({});

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value ? Number(e.target.value) : undefined;
    const newFilters = { ...filters, groupId };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRatingChange = (type: "min" | "max", value: number) => {
    const newFilters = {
      ...filters,
      [`${type}Rating`]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = e.target.value as ReviewFilters["sortBy"];
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="review-filter-controls grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Group Filter */}
      <div>
        <label
          htmlFor="group-filter"
          className="block text-sm font-medium text-gray-700"
        >
          Filter by Group
        </label>
        <select
          id="group-filter"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          onChange={handleGroupChange}
          value={filters.groupId || ""}
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rating Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rating Range
        </label>
        <div className="flex space-x-2 mt-1">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => handleRatingChange("min", Number(e.target.value))}
            value={filters.minRating || ""}
          >
            <option value="">Min Rating</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => handleRatingChange("max", Number(e.target.value))}
            value={filters.maxRating || ""}
          >
            <option value="">Max Rating</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label
          htmlFor="sort-filter"
          className="block text-sm font-medium text-gray-700"
        >
          Sort By
        </label>
        <select
          id="sort-filter"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          onChange={handleSortChange}
          value={filters.sortBy || ""}
        >
          <option value="">Default</option>
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
    </div>
  );
};
