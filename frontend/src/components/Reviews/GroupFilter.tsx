import { useState } from "react";
import { Group } from "../../types/rhcp-types";

interface GroupFilterProps {
  groups: Group[];
  onFilterChange: (groupId: string | null) => void;
}

const GroupFilter: React.FC<GroupFilterProps> = ({
  groups,
  onFilterChange,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value || null;
    setSelectedGroup(groupId);
    onFilterChange(groupId);
  };

  return (
    <select
      value={selectedGroup || ""}
      onChange={handleChange}
      className="w-full border rounded p-2"
    >
      <option value="">All Groups</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  );
};
