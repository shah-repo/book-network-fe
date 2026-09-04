import { Button } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import BookCard from "./BookCard";
import BulkUploadForm from "./BulkUploadForm";
import ManageBookDialog from "./ManageBookDialog";
import ManageBookForm from "./ManageBookForm";
import SectionHeading from "./SectionHeading";
import { TitlePlacement } from "./SectionHeading/types";

export interface BookType {
  id?: number;
  title: string;
  authorName: string;
  isbn: string;
  owner?: string;
  synopsis: string;
  cover?: string; // Image Base64 encoded
  rate?: number;
  archived?: boolean;
  shareable: boolean;
  borrowed?: boolean;
  previewBookUrl?: string;
}

export type FormRefType = { submitForm: () => void };

export const MyBooks: React.FC = () => {
  const [dialogMode, setDialogMode] = useState<"single" | "bulk" | null>(null);
  const [formData, setFormData] = useState<BookType>();
  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<BookType[]>([]);
  const formRef = useRef<FormRefType>({} as FormRefType);
  const bulkFormRef = useRef<FormRefType>({} as FormRefType);
  const fetchAllMyBooks = async () => {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const { data } = await api.get("/api/v1/books/owner", {
        headers,
      });
      console.log({ data });
      setProducts(data.content);
    } catch (error: unknown) {
      toast.error("error");
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  useEffect(() => {
    fetchAllMyBooks();
  }, []);
  const handleClose = () => {
    setDialogMode(null);
    fetchAllMyBooks();
  };
  const addBook = () => {

    setFormData(undefined);
    setDialogMode("single");
  };
  const addBulkBooks = () => {
    setDialogMode("bulk");
  };
  const editBook = (bookId: number) => {
    const book = products.find((book) => bookId === book.id);
    setFormData(book);
    setDialogMode("single");
  };
  const isDialogOpen = dialogMode !== null;
  const isBulk = dialogMode === "bulk";
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
        {/* <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            All Books
          </h2> */}
        <SectionHeading
          title="My Books list"
          placement={TitlePlacement.TopLeft}
          onClick={addBook}
          onBulkClick={addBulkBooks}
        />

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-4">
          {products?.map((product) => (
            <BookCard
              key={product.id}
              book={product}
              editBook={editBook}
              fetchAllMyBooks={fetchAllMyBooks}
              isOwner
            />
          ))}
        </div>
      </div>
      <ManageBookDialog
        formRef={isBulk ? bulkFormRef : formRef}
        title={isBulk ? "Add Books In Bulk" : "Add New Book"}
        content={isBulk ? BulkUploadForm : ManageBookForm}
        isDialogOpen={isDialogOpen}
        handleClose={handleClose}
        data={formData as BookType}
        maxWidth={isBulk ? "xl" : undefined}
        fullWidth={isBulk ? true : undefined}
        paperClassName={isBulk ? "max-w-6xl w-full" : undefined}
        actions={
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              onClick={() =>
                isBulk
                  ? bulkFormRef.current?.submitForm()
                  : formRef.current?.submitForm()
              }
            >
              Save
            </Button>
          </>
        }
      />
    </div>
  );
};
