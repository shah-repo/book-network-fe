import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfAlt,
  faUser,
  faCode,
  faInfoCircle,
  faHeart,
  faBook,
  faEdit,
  faShare,
  faShareNodes,
  faBoxArchive,
  faAt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contextApi/ContextApi";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { toast } from "react-toastify";
import { BookType } from "./MyBooks";
import { AxiosError } from "axios";
import { Chip } from "@mui/material";

interface BookCardProps {
  book: BookType;
  editBook?: (bookId: number) => void;
  fetchAllMyBooks?: () => void;
  isOwner?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  editBook,
  fetchAllMyBooks,
  isOwner,
}) => {
  const {
    id,
    cover,
    title,
    authorName,
    isbn,
    owner,
    synopsis,
    rate,
    shareable,
    archived,
    borrowed: isBorrowed,
  } = book;
  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const borrowBook = async () => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await api.post(`/api/v1/books/borrow/${id}`, null, {
        headers,
      });
      console.log("borrowBook Data:", { id, response });
      if (response.status) {
        toast.success("Book Borrowed Successfull!");
      }
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  const updateShareableStatus = async (bookId: number) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await api.patch(
        `/api/v1/books/shareable/${bookId}`,
        null,
        {
          headers,
        }
      );
      console.log("updateShareableStatus:", { id, response });
      if (response.data > 0) {
        toast.success("Book shareable status updated successfull!");
        fetchAllMyBooks?.();
      }
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  const updateArchiveStatus = async (bookId: number) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await api.patch(
        `/api/v1/books/archived/${bookId}`,
        null,
        {
          headers,
        }
      );
      console.log("updateShareableStatus:", { id, response });
      if (response.data > 0) {
        toast.success("Book archived status updated successfull!");
        fetchAllMyBooks?.();
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message =
          error?.response?.data.error ?? "An unexpected error occurred";
        toast.error(message);

        if (error.status === 403) {
          removeToken();
          navigate("/login", { state: { from: location }, replace: true });
        }
      } else {
        toast.error("An unexpected error occurred");
      }
      console.log({ error });
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between bg-white shadow-lg rounded-lg ${
        isBorrowed
          ? "border-2 border-red-400 opacity-70"
          : archived
          ? "border-2 border-yellow-300"
          : shareable
          ? "border-2 border-green-300"
          : ""
      } overflow-hidden`}
    >
      {/* Show Borrowed Badge */}
      {isBorrowed && (
        <Chip
          label="Borrowed"
          className="absolute top-2 right-2"
          color="error"
        />
      )}
      <div>
        <img
          src={`data:image/png;base64,${cover}`}
          alt={"Book Cover"}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faBook} className="mr-2 text-gray-600" />
            <h3 className="font-bold truncate">{title}</h3>
          </div>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faAt} className="mr-2 text-gray-500" />
            {authorName}
          </p>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faCode} className="mr-2 text-gray-500" />
            {isbn}
          </p>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
            {owner}
          </p>
          <p className="text-gray-600 text-sm mt-2 line-clamp-3 text-pretty">{synopsis}</p>
        </div>
      </div>
      {/* Rating and Actions */}
      <div className="px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          {Array.from({ length: 5 }, (_, i) => (
            <FontAwesomeIcon
              key={i}
              icon={
                i + 0.5 === rate
                  ? faStarHalfAlt
                  : i < rate
                  ? faStar
                  : faStarHalfAlt
              }
              className={`text-${i < rate ? "yellow-500" : "gray-300"} mr-1`}
            />
          ))}
          <span className="ml-2 text-sm font-semibold">{rate}</span>
        </div>
        {isOwner ? (
          <div className="flex space-x-3">
            <FontAwesomeIcon
              icon={faEdit}
              onClick={() => editBook?.(id)}
              className="text-blue-500 cursor-pointer"
            />
            <FontAwesomeIcon
              icon={faShareNodes}
              onClick={() => updateShareableStatus?.(id)}
              className="text-green-500 cursor-pointer"
            />
            <FontAwesomeIcon
              icon={faBoxArchive}
              onClick={() => updateArchiveStatus?.(id)}
              className="text-yellow-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex space-x-3">
            <FontAwesomeIcon
              icon={faInfoCircle}
              className="text-blue-500 cursor-pointer"
            />
            <FontAwesomeIcon
              icon={faBook}
              className="text-orange-500 cursor-pointer"
              onClick={borrowBook}
            />
            <FontAwesomeIcon
              icon={faHeart}
              className="text-red-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
