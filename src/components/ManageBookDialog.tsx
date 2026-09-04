import React, { ComponentType, ReactNode, RefObject } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton
} from "@mui/material";
import { ManageBookFormProps } from "./ManageBookForm";
import { BookType, FormRefType } from "./MyBooks";

interface ManageBookDialogProps {
  title: string;
  content: ComponentType<
    ManageBookFormProps & React.RefAttributes<FormRefType>
  > | ComponentType<{ ref?: RefObject<FormRefType | null>; data?: BookType; closeDialog: () => void }>;
  isDialogOpen: boolean;
  actions?: ReactNode;
  handleClose: () => void;
  data?: BookType;
  formRef?: RefObject<FormRefType | null>;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  fullWidth?: boolean;
  paperClassName?: string;
}

const ManageBookDialog: React.FC<ManageBookDialogProps> = ({
  isDialogOpen,
  handleClose,
  title,
  content: FormContent,
  actions,
  formRef,
  data,
  maxWidth,
  fullWidth,
  paperClassName,
}) => {

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{
        paper: {
          className: paperClassName || "max-w-200",
        },
      }}
    >
      <DialogTitle>
        <span className="text-2xl font-semibold text-gray-800">
          📚 {title}
        </span>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: "absolute",
          right: 16,
          top: 12,
          color: theme.palette.grey[500],
        })}
      >
        <FontAwesomeIcon icon={faXmark} />
      </IconButton>
      <DialogContent dividers>
        <FormContent ref={formRef as RefObject<FormRefType>} data={data as BookType} closeDialog={handleClose} />
      </DialogContent>
      <DialogActions className="px-6 py-4">
        {actions}
      </DialogActions>
    </Dialog>
  );
};

export default ManageBookDialog;
