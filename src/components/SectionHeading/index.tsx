import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import React from "react";
import { SectionHeadingProps, TitlePlacement } from "./types";

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  placement,
  onClick,
  onBulkClick,
}) => {
  if (placement === TitlePlacement.TopLeft) {
    return (
      <div>
        <div className="flex justify-between items-center">
          <span className="flex items-start text-lg font-semibold text-gray-700">
            {title}
          </span>
          <div className="flex items-center gap-2">
            {onClick && (
              <Button
                startIcon={<FontAwesomeIcon icon={faPlus} />}
                variant="outlined"
                onClick={onClick}
              >
                Add New Book
              </Button>
            )}
            {onBulkClick && (
              <Button
                startIcon={<FontAwesomeIcon icon={faPlus} />}
                variant="outlined"
                onClick={onBulkClick}
              >
                Add New Books In Bulk
              </Button>
            )}
          </div>
        </div>
        <div className="w-full my-6">
          <span className="flex flex-grow border-t border-gray-300"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center w-full my-6">
      <span className="flex-grow border-t border-gray-300"></span>
      <span className="px-4 text-lg font-semibold text-gray-700">{title}</span>
      <span className="flex-grow border-t border-gray-300"></span>
    </div>
  );
};

export default SectionHeading;
