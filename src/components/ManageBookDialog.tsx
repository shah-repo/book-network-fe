import React, { ComponentType, ReactElement, ReactNode, Ref, RefObject, useRef } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import ManageBookForm, { ManageBookFormProps } from "./ManageBookForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { BookType, FormRefType } from "./MyBooks";

interface ManageBookDialogProps {
  title: string
  content: ComponentType<ManageBookFormProps>
  isDialogOpen: boolean;
  actions?: ReactNode
  handleClose: () => void;
  data: BookType
  formRef: RefObject<FormRefType>
}

const ManageBookDialog: React.FC<ManageBookDialogProps> = ({
  isDialogOpen,
  handleClose,
  title,
  content,
  actions,
  formRef,
  data,
}) => {
  const FormContent = content;

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleClose}
      slotProps={{
        paper: {
          className: "max-w-200",
        },
      }}
    >
      <DialogTitle>
        <h2 className="text-2xl font-semibold text-gray-800">
          📚 {title}
        </h2>
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
        <FormContent ref={formRef} data={data} closeDialog={handleClose} />
      </DialogContent>
      <DialogActions className="px-6 py-4">
        {actions}
      </DialogActions>
    </Dialog>
  );
};

export default ManageBookDialog;
