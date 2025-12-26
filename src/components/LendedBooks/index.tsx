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
import ReturnBorrowedBook from "../BorrowedBooks/ReturnBorrowedBook";
import { Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPaperPlane,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { schema } from "../BorrowedBooks/constants";


export const LendedBooks: React.FC = () => {
  const [formData, setFormData] = useState<BookType>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  const [products, setProducts] = useState<BookType[]>([]);
  const formRef = useRef<FormRefType>(null);

  const fetchAllMyBooks = async () => {
    try {
      const { data } = await axiosPrivate.get("/api/v1/books/lended");
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

  const approveReturnedBook = async (bookId: number) => {
      try {
        const { data } = await axiosPrivate.patch(`/api/v1/books/borrow/return/approve/${bookId}`);
        console.log("approveReturnedBook:", { data });
        fetchAllMyBooks();
        toast.success("Approved Returned Successfully!");
      } catch (error) {
        toast.error("error");
        if (error.status === 403) {
          removeToken();
          navigate("/login", { state: { from: location }, replace: true });
        }
        console.log({ error });
      }
    }
  

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl lg:max-w-7xl ">
        <SectionHeading
          title="My Lended Books"
          placement={TitlePlacement.TopLeft}
        />

        <div className="mt-6">
          <BasicTable data={products} schema={schema} approveReturnedBook={approveReturnedBook}/>
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
