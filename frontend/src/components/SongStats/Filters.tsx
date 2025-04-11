import React from "react";
import { FiltersState, Group, GroupMember } from "../../types/rhcp-types";

interface FiltersProps {
  groups: Group[];
  members: GroupMember[];
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  loadingMembers?: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  groups,
  members,
  filters,
  onFilterChange,
  loadingMembers = false,
}) => {
  // Handlers for filter changes
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value;
    // When changing groups, reset the user filter to avoid confusion
    onFilterChange({ groupId, userId: "all" });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ userId: e.target.value });
  };

  const handleShowUserOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ showUserOnly: e.target.checked });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h4 className="text-gray-700 font-semibold mb-4">Filter Options</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Group Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group
          </label>
          <select
            value={filters.groupId}
            onChange={handleGroupChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All (Public)</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id.toString()}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Ratings
          </label>
          <select
            value={filters.userId}
            onChange={handleUserChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loadingMembers}
          >
            <option value="all">All Users</option>
            {members.map((member) => (
              <option key={member.id} value={member.id.toString()}>
                {member.username}
              </option>
            ))}
          </select>
          {loadingMembers && (
            <div className="text-xs text-gray-500 mt-1">Loading members...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Filters);
