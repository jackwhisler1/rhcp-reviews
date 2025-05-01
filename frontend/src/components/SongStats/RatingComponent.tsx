import { Rating } from "react-simple-star-rating";
import { LoadingSpinner } from "../common";
import { useState, useEffect } from "react";

interface RatingComponentProps {
  value: number;
  onSubmit: (stars: number) => void;
  isSubmitting?: boolean;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  value,
  onSubmit,
  isSubmitting,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  return (
    <div className="relative inline-flex items-center">
      <Rating
        onClick={onSubmit}
        initialValue={localValue / 2}
        size={20}
        allowFraction
        iconsCount={5}
        transition
        readonly={isSubmitting}
      />{" "}
      <span className="ml-2 text-sm font-medium">{localValue.toFixed(1)}</span>
      {isSubmitting && (
        <div className="ml-2">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
export default RatingComponent;
