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
import ReturnBorrowedBook from "./ReturnBorrowedBook";
import { Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPaperPlane,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { schema } from "./constants";
import { ReturnBookFormData } from "./types";

export const BorrowedBooks: React.FC = () => {
  const [formData, setFormData] = useState<BookType>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  const [products, setProducts] = useState<BookType[]>([]);
  const formRef = useRef<FormRefType>(null);

  const fetchAllMyBorrowedBooks = async () => {
    try {
      const { data } = await axiosPrivate.get("/api/v1/books/borrowed");
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
    fetchAllMyBorrowedBooks();
  }, []);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const returnBook = (book: BookType) => {
    setFormData(book);
    openDialog();
  };

  const handleClose = () => {
    closeDialog();
    fetchAllMyBorrowedBooks();
  };

  const saveFeedbackAndReturn = async (
    feedbackData: ReturnBookFormData,
    bookId: number
  ) => {
    const requestPayload = {
      ...feedbackData,
      bookId,
    };
    try {
      const { data } = await axiosPrivate.post(
        "/api/v1/feedbacks",
        requestPayload
      );
      console.log("saveFeedbackAndReturn:", { data });
      if (data > 0) {
        const { data } = await axiosPrivate.patch(
          `/api/v1/books/borrow/return/${bookId}`,
          requestPayload
        );
        console.log("Book Returned", { data });
      }
      handleClose();

      toast.success("Feedback Saved and Returned Successfully!");
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  const returnBookOnly = async () => {
    const bookId = formData?.id;
    try {
      const { data } = await axiosPrivate.patch(
        `/api/v1/books/borrow/return/${bookId}`
      );
      console.log("Book Returned", { data });
      toast.success("Book Returned Successfully!");
      handleClose();
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl lg:max-w-7xl ">
        <SectionHeading
          title="My Borrowed Books"
          placement={TitlePlacement.TopLeft}
        />

        <div className="mt-6">
          <BasicTable
            isBorrowedTable
            data={products}
            schema={schema}
            returnBook={returnBook}
          />
        </div>
      </div>
      <ManageBookDialog
        formRef={formRef}
        title="Return and Share Feedback"
        content={ReturnBorrowedBook}
        {...{
          isDialogOpen,
          handleClose,
          data: formData as BookType,
          saveFeedbackAndReturn,
        }}
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
              onClick={returnBookOnly}
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
