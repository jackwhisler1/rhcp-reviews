import { FiltersState, Group, GroupMember } from "../../types/rhcp-types";

interface FiltersProps {
  groups: Group[];
  members: GroupMember[];
  filters: FiltersState;
  onFilterChange: (newFilters: Partial<FiltersState>) => void;
}

const Filters = ({
  groups,
  members,
  filters,
  onFilterChange,
}: FiltersProps) => {
  const handleGroupChange = (groupId: string) => {
    onFilterChange({
      groupId,
      userId: "all",
      showUserOnly: false,
    });
  };

  return (
    <div className="filters-container flex gap-4 mb-6 flex-wrap">
      {/* Group Selector */}
      <select
        className="filter-select"
        value={filters.groupId}
        onChange={(e) => handleGroupChange(e.target.value)}
      >
        <option value="all">All Reviews</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>

      {/* User Selector */}
      {filters.groupId !== "all" && (
        <select
          className="filter-select"
          value={filters.userId}
          onChange={(e) => onFilterChange({ userId: e.target.value })}
        >
          <option value="all">All Members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.username}
            </option>
          ))}
        </select>
      )}

      {/* User Only Toggle */}
      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.showUserOnly}
          onChange={(e) => onFilterChange({ showUserOnly: e.target.checked })}
        />
        Show Only My Reviews
      </label>
    </div>
  );
};
export default Filters;
