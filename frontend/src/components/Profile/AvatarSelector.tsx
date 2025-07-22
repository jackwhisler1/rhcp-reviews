import { ReactComponent as PepperAvatar } from "../../assets/pepper-avatar.svg";
import { JSX, useEffect, useState } from "react";

export default function AvatarSelector({
  selectedColor,
  onSelect,
}: {
  selectedColor: string;
  onSelect: (avatarComponent: JSX.Element, color: string) => void;
}) {
  const colors = [
    "#EF4444", // red-500
    "#10B981", // green-500
    "#3B82F6", // blue-500
    "#F59E0B", // yellow-500
    "#EC4899", // pink-500
    "#8B5CF6", // purple-500
    "#14B8A6", // teal-500
    "#FB923C", // orange-500
  ];

  const [color, setColor] = useState<string>(selectedColor || colors[0]);

  useEffect(() => {
    if (selectedColor) {
      setColor(selectedColor);
    }
  }, [selectedColor]);

  const handleSelect = (newColor: string) => {
    setColor(newColor);
    onSelect(<PepperAvatar style={{ color: newColor }} />, newColor);
  };

  return (
    <div className="space-y-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <PepperAvatar className="w-12 h-12 text-white" style={{ color }} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => handleSelect(c)}
            className={`w-8 h-8 rounded-full border-2 ${
              color === c ? "border-black" : "border-white"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
