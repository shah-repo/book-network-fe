import React from "react";
import { SectionHeadingProps, TitlePlacement } from "./types";
import { Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  placement,
  onClick,
}) => {
  if (placement === TitlePlacement.TopLeft) {
    return (
      <div>
        <div className="flex justify-between items-center">
          <span className="flex items-start text-lg font-semibold text-gray-700">
            {title}
          </span>
          {onClick && <Button
            startIcon={<FontAwesomeIcon icon={faPlus} />}
            variant="outlined"
            onClick={onClick}
          >
            Add New Book
          </Button>}
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
