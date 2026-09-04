import { Checkbox, FormControlLabel } from "@mui/material";
import axios from "axios";
import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import BookCard from "./BookCard";
import { BookType } from "./MyBooks";
export interface BulkBookFormProps {
  data: BookType;
  closeDialog: () => void;
}
const REQUIRED_COLUMNS = [
  "title",
  "authorName",
  "isbn",
  "synopsis",
  "shareable",
  "previewBookUrl",
];
type PreviewBook = BookType & { previewBookUrl?: string };
const parseBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  return false;
};
const isRowValid = (row: Record<string, unknown>): boolean => {
  const title = row.title;
  const authorName = row.authorName;
  const isbn = row.isbn;
  const synopsis = row.synopsis;
  return (
    typeof title === "string" &&
    title.trim() !== "" &&
    typeof authorName === "string" &&
    authorName.trim() !== "" &&
    isbn !== undefined &&
    String(isbn).trim() !== "" &&
    typeof synopsis === "string" &&
    synopsis.trim() !== ""
  );
};
const BulkBookForm: React.FC<BulkBookFormProps> = forwardRef((props, ref) => {
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [books, setBooks] = useState<PreviewBook[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const allSelected = books.length > 0 && selected.every((s) => s);
  const resetState = () => {
    setBooks([]);
    setSelected([]);
  };
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    resetState();
    if (!event.target.files || event.target.files.length === 0) {
      setFileName("No file chosen");
      toast.error("Please select an Excel (.xlsx) file to upload.");
      return;
    }
    const file = event.target.files[0];
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Only .xlsx Excel files are supported.");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const headers = Object.keys(
        (XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        })[0] as Record<string, unknown>) ?? {}
      ).length
        ? (XLSX.utils.sheet_to_json(sheet, {
            header: 1,
          })[0] as string[])
        : [];
      const hasAllColumns = REQUIRED_COLUMNS.every((col) =>
        headers.includes(col)
      );
      if (!hasAllColumns) {
        toast.error(
          "The uploaded file is missing one or more required columns."
        );
        return;
      }
      if (rows.length === 0) {
        toast.error("The uploaded Excel file contains no books to import.");
        return;
      }
      const allValid = rows.every((row) => isRowValid(row));
      if (!allValid) {
        toast.error(
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
        );
        return;
      }
      const parsedBooks: PreviewBook[] = rows.map((row, index) => ({
        id: index,
        title: String(row.title),
        authorName: String(row.authorName),
        isbn: String(row.isbn),
        synopsis: String(row.synopsis),
        shareable: parseBoolean(row.shareable),
        previewBookUrl: String(row.previewBookUrl ?? ""),
        owner: "",
        cover: "",
        rate: 0,
        archived: false,
      }));
      setBooks(parsedBooks);
      setSelected(parsedBooks.map(() => true));
    } catch (error) {
      console.log({ error });
      toast.error(
        "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
      );
    }
  };
  const toggleSelectAll = () => {
    const next = !allSelected;
    setSelected(books.map(() => next));
  };
  const toggleBook = (index: number) => {
    setSelected((prev) =>
      prev.map((value, i) => (i === index ? !value : value))
    );
  };
  const saveBook = async (book: PreviewBook) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    const { title, authorName, isbn, synopsis, shareable } = book;
    const payload = { title, authorName, isbn, synopsis, shareable };
    const { data: bookId } = await api.post("/api/v1/books", payload, {
      headers,
    });
    return bookId;
  };
  const uploadBooks = async () => {
    const booksToCreate = books.filter((_, index) => selected[index]);
    try {
      for (const book of booksToCreate) {
        await saveBook(book);
      }
      resetState();
      props.closeDialog();
      toast.success("Books Saved Successfull!");
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
    submitForm: () => uploadBooks(),
  }));
  const previewCards = useMemo(
    () =>
      books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          preview
          selected={selected[index]}
          onToggleSelect={() => toggleBook(index)}
        />
      )),
    [books, selected]
  );
  return (
    <div className="max-w-5xl mx-auto bg-white">
      <div className="mb-4">
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
      {books.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Preview</h3>
          <FormControlLabel
            control={
              <Checkbox
                checked={allSelected}
                onChange={toggleSelectAll}
                inputProps={{ "aria-label": "Select All" }}
              />
            }
            label="Select All"
          />
          <div className="mt-2 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {previewCards}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
export default BulkBookForm;