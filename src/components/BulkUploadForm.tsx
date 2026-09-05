import { Checkbox, FormControlLabel } from "@mui/material";
import axios from "axios";
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import BookCard from "./BookCard";
import { ManageBookFormProps } from "./ManageBookForm";
import { BookType, FormRefType } from "./MyBooks";

export const REQUIRED_BULK_COLUMNS = [
  "title",
  "authorName",
  "isbn",
  "synopsis",
  "shareable",
  "previewBookUrl",
] as const;

export const BULK_UPLOAD_ERRORS = {
  NO_FILE: "Please select an Excel (.xlsx) file to upload.",
  INVALID_FILE_TYPE: "Only .xlsx Excel files are supported.",
  MISSING_COLUMNS: "The uploaded file is missing one or more required columns.",
  EMPTY_FILE: "The uploaded Excel file contains no books to import.",
  INVALID_ROWS:
    "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
  NO_SELECTION: "Please select at least one book to import.",
};

export interface ParsedBulkBook {
  id: number;
  title: string;
  authorName: string;
  isbn: string;
  synopsis: string;
  shareable: boolean;
  previewBookUrl: string;
  selected: boolean;
}

class BulkUploadValidationError extends Error {
  constructor(public code: keyof typeof BULK_UPLOAD_ERRORS) {
    super(code);
  }
}

const parseShareableValue = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

export const parseBulkBookExcelFile = (file: File): Promise<ParsedBulkBook[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as unknown[][];

        if (!rows || rows.length === 0) {
          reject(new BulkUploadValidationError("EMPTY_FILE"));
          return;
        }

        const headerRow = (rows[0] as unknown[]).map((header) =>
          String(header ?? "").trim()
        );

        const missingColumns = REQUIRED_BULK_COLUMNS.filter(
          (column) => !headerRow.includes(column)
        );

        if (missingColumns.length > 0) {
          reject(new BulkUploadValidationError("MISSING_COLUMNS"));
          return;
        }

        const dataRows = rows
          .slice(1)
          .filter((row) =>
            row.some((cell) => String(cell ?? "").trim() !== "")
          );

        if (dataRows.length === 0) {
          reject(new BulkUploadValidationError("EMPTY_FILE"));
          return;
        }

        const books: ParsedBulkBook[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowObj: Record<string, unknown> = {};
          headerRow.forEach((column, index) => {
            rowObj[column] = row[index];
          });

          const title = String(rowObj.title ?? "").trim();
          const authorName = String(rowObj.authorName ?? "").trim();
          const isbn = String(rowObj.isbn ?? "").trim();
          const synopsis = String(rowObj.synopsis ?? "").trim();
          const previewBookUrl = String(rowObj.previewBookUrl ?? "").trim();
          const shareable = parseShareableValue(rowObj.shareable);

          if (
            !title ||
            !authorName ||
            !isbn ||
            !synopsis ||
            shareable === undefined
          ) {
            reject(new BulkUploadValidationError("INVALID_ROWS"));
            return;
          }

          books.push({
            id: i + 1,
            title,
            authorName,
            isbn,
            synopsis,
            shareable,
            previewBookUrl,
            selected: true,
          });
        }

        resolve(books);
      } catch (error) {
        reject(
          error instanceof BulkUploadValidationError
            ? error
            : new BulkUploadValidationError("INVALID_ROWS")
        );
      }
    };

    reader.onerror = () => reject(new BulkUploadValidationError("INVALID_ROWS"));

    reader.readAsArrayBuffer(file);
  });
};

const BulkUploadForm: React.ForwardRefExoticComponent<
  ManageBookFormProps & React.RefAttributes<FormRefType>
> = forwardRef(
  (props, ref) => {
    const [fileName, setFileName] = useState<string>("No file chosen");
    const [file, setFile] = useState<File>();
    const [parsedBooks, setParsedBooks] = useState<ParsedBulkBook[]>([]);
    const { token, removeToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const allSelected =
      parsedBooks.length > 0 && parsedBooks.every((book) => book.selected);

    const handleSelectAllChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const checked = event.target.checked;
      setParsedBooks((prev) =>
        prev.map((book) => ({ ...book, selected: checked }))
      );
    };

    const handleToggleSelect = (bookId: number, selected: boolean) => {
      setParsedBooks((prev) =>
        prev.map((book) =>
          book.id === bookId ? { ...book, selected } : book
        )
      );
    };

    const showValidationError = (code: keyof typeof BULK_UPLOAD_ERRORS) => {
      toast.error(BULK_UPLOAD_ERRORS[code]);
    };

    const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFile = event.target.files?.[0];
      setParsedBooks([]);
      setFile(undefined);

      if (!selectedFile) {
        setFileName("No file chosen");
        showValidationError("NO_FILE");
        return;
      }

      const isXlsx = selectedFile.name.toLowerCase().endsWith(".xlsx");
      if (!isXlsx) {
        setFileName(selectedFile.name);
        showValidationError("INVALID_FILE_TYPE");
        event.target.value = "";
        return;
      }

      setFileName(selectedFile.name);

      try {
        const books = await parseBulkBookExcelFile(selectedFile);
        setFile(selectedFile);
        setParsedBooks(books);
      } catch (error) {
        setFile(undefined);
        setParsedBooks([]);
        if (error instanceof BulkUploadValidationError) {
          showValidationError(error.code);
        } else {
          showValidationError("INVALID_ROWS");
        }
      }
    };

    const handleUpload = async () => {
      if (!file) {
        showValidationError("NO_FILE");
        return;
      }

      const selectedBooks = parsedBooks.filter((book) => book.selected);

      if (selectedBooks.length === 0) {
        showValidationError("NO_SELECTION");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        for (const book of selectedBooks) {
          const { title, authorName, isbn, synopsis, shareable } = book;
          await api.post(
            "/api/v1/books",
            { title, authorName, isbn, synopsis, shareable },
            { headers }
          );
        }

        toast.success("Books Uploaded Successfully!");
        setParsedBooks([]);
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
        handleUpload();
      },
    }));

    return (
      <div className="max-w-5xl mx-auto bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <input
              type="file"
              id="bulkBookFile"
              className="hidden"
              accept=".xlsx"
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

          {parsedBooks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-700">Preview</h4>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    onChange={handleSelectAllChange}
                    inputProps={{ "aria-label": "Select all books" }}
                  />
                }
                label="Select All"
              />
              <div className="max-h-96 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {parsedBooks.map((book) => {
                    const cardBook: BookType = {
                      id: book.id,
                      title: book.title,
                      authorName: book.authorName,
                      isbn: book.isbn,
                      owner: "",
                      synopsis: book.synopsis,
                      cover: "",
                      rate: 0,
                      archived: false,
                      shareable: book.shareable,
                      borrowed: false,
                    };

                    return (
                      <BookCard
                        key={book.id}
                        book={cardBook}
                        previewMode
                        previewBookUrl={book.previewBookUrl}
                        selected={book.selected}
                        onSelectChange={handleToggleSelect}
                      />
                    );
                  })}
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