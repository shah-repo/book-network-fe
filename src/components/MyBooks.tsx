import React, { useEffect, useRef, useState } from "react";
import SectionHeading from "./SectionHeading";
import { TitlePlacement } from "./SectionHeading/types";
import BookCard from "./BookCard";
import ManageBookDialog from "./ManageBookDialog";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import ManageBookForm from "./ManageBookForm";
import { Button } from "@mui/material";

export interface BookType {
  id: number;
  title: string;
  authorName: string;
  isbn: string;
  owner: string;
  synopsis: string;
  cover: string; // Image Base64 encoded
  rate: number;
  archived: boolean;
  shareable: boolean;
  borrowed?: boolean;
}

export type FormRefType = { submitForm: () => void } | null;

export const MyBooks: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BookType>();
  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<BookType[]>([]);
  const formRef = useRef<FormRefType>(null);

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
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  useEffect(() => {
    fetchAllMyBooks();
  }, []);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    fetchAllMyBooks();
  };

  const addBook = () => {
    openDialog();
    setFormData(undefined);
  };

  const editBook = (bookId: number) => {
    openDialog();
    const book = products.find((book) => bookId === book.id);
    setFormData(book);
  };

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
        formRef={formRef}
        title="Add New Book"
        content={ManageBookForm}
        {...{ isDialogOpen, handleClose, data: formData as BookType }}
        actions={
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              onClick={() => formRef.current?.submitForm()}
            >
              Save
            </Button>
          </>
        }
      />
    </div>
  );
};
