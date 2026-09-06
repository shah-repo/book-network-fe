import { Checkbox, FormControlLabel } from "@mui/material";
import axios from "axios";
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createBook } from "../api/books";
import { useAuth } from "../contextApi/ContextApi";
import {
    BULK_UPLOAD_ERRORS,
    BulkUploadValidationError,
    ParsedBookRow,
    parseBulkBookExcel,
} from "../utils/excelBookParser";
import BookCard from "./BookCard";
import { BookType } from "./MyBooks";

export interface BulkUploadFormProps {
  data?: BookType;
  closeDialog: () => void;
}

export interface PreviewBook extends ParsedBookRow {
  id: number;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = forwardRef(
  (props, ref) => {
    const [fileName, setFileName] = useState<string>("No file chosen");
    const [file, setFile] = useState<File>();
    const [previewBooks, setPreviewBooks] = useState<PreviewBook[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const { token, removeToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const allSelected =
      previewBooks.length > 0 && selectedIds.size === previewBooks.length;

    const resetPreview = () => {
      setPreviewBooks([]);
      setSelectedIds(new Set());
    };

    const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFile = event.target.files?.[0];
      resetPreview();

      if (!selectedFile) {
        setFile(undefined);
        setFileName("No file chosen");
        toast.error(BULK_UPLOAD_ERRORS.NO_FILE);
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);

      try {
        const rows = await parseBulkBookExcel(selectedFile);
        const books: PreviewBook[] = rows.map((row, index) => ({
          ...row,
          id: index + 1,
        }));
        setPreviewBooks(books);
        setSelectedIds(new Set(books.map((book) => book.id)));
      } catch (error) {
        if (error instanceof BulkUploadValidationError) {
          toast.error(error.message);
        } else {
          toast.error(BULK_UPLOAD_ERRORS.INVALID_ROWS);
        }
        console.log({ error });
      }
    };

    const toggleSelectAll = (checked: boolean) => {
      setSelectedIds(
        checked ? new Set(previewBooks.map((book) => book.id)) : new Set()
      );
    };

    const toggleSelectBook = (bookId: number, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(bookId);
        } else {
          next.delete(bookId);
        }
        return next;
      });
    };

    const submitBulkUpload = async () => {
      if (!file) {
        toast.error(BULK_UPLOAD_ERRORS.NO_FILE);
        return;
      }

      if (previewBooks.length === 0) {
        return;
      }

      const booksToCreate = previewBooks.filter((book) =>
        selectedIds.has(book.id)
      );

      if (booksToCreate.length === 0) {
        toast.error("Please select at least one book to import.");
        return;
      }

      try {
        for (const book of booksToCreate) {
          const payload = {
            title: book.title,
            authorName: book.authorName,
            isbn: book.isbn,
            synopsis: book.synopsis,
            shareable: book.shareable,
          };
          await createBook(payload, token);
        }
        toast.success("Books uploaded successfully!");
        resetPreview();
        setFile(undefined);
        setFileName("No file chosen");
        props.closeDialog();
      } catch (error: unknown) {
        toast.error("error");
        if (axios.isAxiosError(error) && error?.response?.status === 403) {
          removeToken();
          navigate("/login", { state: { from: location }, replace: true });
        }
        console.log({ error });
      }
    };

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        submitBulkUpload();
      },
    }));

    return (
      <div className="max-w-5xl mx-auto bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <input
              type="file"
              id="bulkBookFile"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="bulkBookFile"
              className="bg-gray-300 px-4 py-2 rounded cursor-pointer"
            >
              Choose file
            </label>
            <span className="ml-2 text-gray-600 text-sm">{fileName}</span>
          </div>

          {previewBooks.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Preview
              </span>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    onChange={(event) =>
                      toggleSelectAll(event.target.checked)
                    }
                  />
                }
                label="Select All"
              />
              <div
                data-testid="bulk-upload-preview"
                className="max-h-96 overflow-y-auto pr-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {previewBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={{
                        id: book.id,
                        title: book.title,
                        authorName: book.authorName,
                        isbn: book.isbn,
                        synopsis: book.synopsis,
                        shareable: book.shareable,
                      }}
                      isPreview
                      previewImageUrl={book.previewBookUrl}
                      selected={selectedIds.has(book.id)}
                      onSelectToggle={toggleSelectBook}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default BulkUploadForm;