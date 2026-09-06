import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
} from "@mui/material";
import axios from "axios";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import { parseAndValidateExcel, ParsedBook } from "../utils/excelParser";
import BookCard from "./BookCard";

export interface BulkBookUploadDialogProps {
  isDialogOpen: boolean;
  handleClose: () => void;
  onSuccess?: () => void;
}

const BulkBookUploadDialog: React.FC<BulkBookUploadDialogProps> = ({
  isDialogOpen,
  handleClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [parsedBooks, setParsedBooks] = useState<ParsedBook[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    setFile(null);
    setFileName("");
    setParsedBooks([]);
    setSelectedIndices(new Set());
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const onDialogClose = () => {
    handleReset();
    handleClose();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setErrorMessage("");
    if (!event.target.files || event.target.files.length === 0) {
      setFile(null);
      setFileName("");
      setParsedBooks([]);
      setSelectedIndices(new Set());
      setErrorMessage("Please select an Excel (.xlsx) file to upload.");
      toast.error("Please select an Excel (.xlsx) file to upload.");
      return;
    }

    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);

    const result = await parseAndValidateExcel(selectedFile);
    if (result.error) {
      setParsedBooks([]);
      setSelectedIndices(new Set());
      setErrorMessage(result.error);
      toast.error(result.error);
      return;
    }

    if (result.books) {
      setParsedBooks(result.books);
      setSelectedIndices(new Set(result.books.map((_, i) => i)));
      setErrorMessage("");
    }
  };

  const isSelectAllChecked =
    parsedBooks.length > 0 && selectedIndices.size === parsedBooks.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndices(new Set(parsedBooks.map((_, i) => i)));
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleToggleBook = (index: number, checked?: boolean) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      const isCurrentlySelected = next.has(index);
      const shouldSelect =
        checked !== undefined ? checked : !isCurrentlySelected;
      if (shouldSelect) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setErrorMessage("Please select an Excel (.xlsx) file to upload.");
      toast.error("Please select an Excel (.xlsx) file to upload.");
      return;
    }

    if (parsedBooks.length === 0) {
      return;
    }

    const booksToCreate = parsedBooks.filter((_, idx) =>
      selectedIndices.has(idx)
    );

    if (booksToCreate.length === 0) {
      onDialogClose();
      return;
    }

    setIsSubmitting(true);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      for (const book of booksToCreate) {
        const payload = {
          title: book.title,
          authorName: book.authorName,
          isbn: book.isbn,
          synopsis: book.synopsis,
          shareable: book.shareable,
        };
        await api.post("/api/v1/books", payload, { headers });
      }

      toast.success("Books Saved Successfully!");
      onSuccess?.();
      onDialogClose();
    } catch (error: unknown) {
      toast.error("error");
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onClose={onDialogClose}
      maxWidth="xl"
      fullWidth
      slotProps={{
        paper: {
          className: "max-w-7xl",
        },
      }}
    >
      <DialogTitle>
        <span className="text-2xl font-semibold text-gray-800">
          📚 Add Books In Bulk
        </span>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onDialogClose}
        sx={(theme) => ({
          position: "absolute",
          right: 16,
          top: 12,
          color: theme.palette.grey[500],
        })}
      >
        <FontAwesomeIcon icon={faXmark} />
      </IconButton>
      <DialogContent dividers className="space-y-4">
        {/* Upload Section */}
        <div>
          <input
            type="file"
            id="bulkExcelInput"
            data-testid="bulk-excel-input"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="bulkExcelInput"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded cursor-pointer inline-block text-sm font-medium"
          >
            Choose file
          </label>
          <span className="ml-3 text-gray-600 text-sm">
            {fileName || "No file chosen"}
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <Alert severity="error" className="my-2">
            {errorMessage}
          </Alert>
        )}

        {/* Dedicated Preview Section */}
        {parsedBooks.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-2">
              Preview
            </h4>
            <div className="mb-3">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSelectAllChecked}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    inputProps={{ "aria-label": "Select All" }}
                  />
                }
                label="Select All"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {parsedBooks.map((book, index) => (
                  <BookCard
                    key={index}
                    book={{
                      ...book,
                      id: index + 1,
                      rate: 0,
                      owner: "",
                      cover: "",
                      archived: false,
                    }}
                    mode="preview"
                    isPreview
                    selected={selectedIndices.has(index)}
                    isSelected={selectedIndices.has(index)}
                    onToggleSelect={(checked) =>
                      handleToggleBook(index, checked)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions className="px-6 py-4">
        <Button onClick={onDialogClose}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkBookUploadDialog;