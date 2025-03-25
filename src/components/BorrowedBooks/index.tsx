import React, { useEffect, useRef, useState } from "react";
import SectionHeading from "../SectionHeading";
import { TitlePlacement } from "../SectionHeading/types";
import ManageBookDialog from "../ManageBookDialog";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { BookType, FormRefType } from "../MyBooks";
import BasicTable from "../Table";
import ReturnBorrowedBook from "../ReturnBorrowedBook";
import { Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPaperPlane,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";

export const BorrowedBooks: React.FC = () => {
  const [formData, setFormData] = useState<BookType>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      const { data } = await api.get("/api/v1/books/borrowed", {
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

  const returnBook = (book: BookType) => {
    setFormData(book);
    openDialog();
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    fetchAllMyBooks();
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
        {/* <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            All Books
          </h2> */}

        <SectionHeading
          title="My Borrowed Books"
          placement={TitlePlacement.TopLeft}
        />

        <div className="mt-6">
          <BasicTable data={products} returnBook={returnBook} />
        </div>
      </div>
      <ManageBookDialog
        formRef={formRef}
        title="Return and Share Feedback"
        content={ReturnBorrowedBook}
        {...{ isDialogOpen, handleClose, data: formData as BookType }}
        actions={
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              className="flex items-center gap-2"
              onClick={() => formRef.current?.submitForm()}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> Rate & Return
            </Button>
            <Button
              variant="contained"
              color="success"
              className="flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Just Return
            </Button>
            <Button
              variant="contained"
              color="error"
              className="flex items-center gap-2"
              onClick={handleClose}
            >
              <FontAwesomeIcon icon={faTimes} /> Cancel
            </Button>
          </div>
        }
      />
    </div>
  );
};
