import React from "react";
import { FiltersState, Group, GroupMember } from "../../types/rhcp-types";

interface FiltersProps {
  groups: Group[];
  members: GroupMember[];
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  loadingMembers?: boolean;
}

export const Filters: React.FC<FiltersProps> = ({
  groups,
  members,
  filters,
  onFilterChange,
  loadingMembers = false,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center bg-white rounded-lg p-3 shadow-sm">
      {/* Group Filter */}
      <div className="flex-grow min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Group
        </label>
        <select
          value={filters.groupId}
          onChange={(e) => onFilterChange({ groupId: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All (Public)</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id.toString()}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* User Filter - only show if a group is selected */}
      {filters.groupId !== "all" && (
        <div className="flex-grow min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            User Ratings
          </label>
          <select
            value={filters.userId}
            onChange={(e) => onFilterChange({ userId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loadingMembers}
          >
            <option value="all">All Users</option>
            {members.map((member) => (
              <option key={member.id} value={member.id.toString()}>
                {member.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show user only checkbox */}
      <div className="flex items-end h-full pb-1 ml-2">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            checked={filters.showUserOnly}
            onChange={(e) => onFilterChange({ showUserOnly: e.target.checked })}
          />
          <span className="ml-2 text-xs text-gray-700">Your ratings only</span>
        </label>
      </div>
    </div>
  );
};
export default Filters;
