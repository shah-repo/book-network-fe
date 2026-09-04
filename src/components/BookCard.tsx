import {
  faAt,
  faBook,
  faBoxArchive,
  faCode,
  faEdit,
  faHeart,
  faInfoCircle,
  faShareNodes,
  faStar,
  faStarHalfAlt,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox, Chip, IconButton, Tooltip } from "@mui/material";
import axios, { AxiosError } from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contextApi/ContextApi";
import { useAxiosPrivate } from "../hooks/useAxiosPrivate";
import { BookType } from "./MyBooks";

const TruncatedText: React.FC<{
  text: string;
  className?: string;
  as?: "span" | "p" | "h3";
}> = ({ text, className, as = "span" }) => {
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    setIsTruncated(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
  }, [text]);
  const Component = as;
  const content = (
    <Component ref={ref as never} className={className}>
      {text}
    </Component>
  );
  if (!isTruncated) {
    return content;
  }
  return (
    <Tooltip title={text} placement="top" arrow>
      {content}
    </Tooltip>
  );
};

interface BookCardProps {
  book: BookType;
  editBook?: (bookId: number) => void;
  fetchAllMyBooks?: () => void;
  isOwner?: boolean;
  preview?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  editBook,
  fetchAllMyBooks,
  isOwner,
  preview,
  selected,
  onToggleSelect,
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
    previewBookUrl,
  } = book;
  const { removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  const borrowBook = async () => {
    try {
      const response = await axiosPrivate.post(`/api/v1/books/borrow/${id}`);
      console.log("borrowBook Data:", { id, response });
      if (response.status) {
        toast.success("Book Borrowed Successfull!");
      }
    } catch (error: unknown) {
      toast.error("error");
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  const updateShareableStatus = async (bookId: number) => {
    try {
      const response = await axiosPrivate.patch(`/api/v1/books/shareable/${bookId}`);
      console.log("updateShareableStatus:", { id, response });
      if (response.data > 0) {
        toast.success("Book shareable status updated successfull!");
        fetchAllMyBooks?.();
      }
    } catch (error: unknown) {
      toast.error("error");
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  const updateArchiveStatus = async (bookId: number) => {
    try {
      const response = await axiosPrivate.patch(
        `/api/v1/books/archived/${bookId}`
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
      data-testid={`book-card-${id}`}
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
          src={preview ? previewBookUrl : `data:image/png;base64,${cover}`}
          alt={"Book Cover"}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faBook} className="mr-2 text-gray-600" />
            <TruncatedText as="h3" text={title} className="font-bold truncate flex-1 min-w-0" />
            {preview && (
              <Checkbox
                checked={!!selected}
                onChange={onToggleSelect}
                size="small"
                className="ml-2 p-0 flex-shrink-0"
                inputProps={{ "aria-label": `Select book ${title}` }}
              />
            )}
          </div>
          <p className="text-gray-700 text-sm flex items-center mt-1 min-w-0">
            <FontAwesomeIcon icon={faAt} className="mr-2 text-gray-500 flex-shrink-0" />
            <TruncatedText text={authorName} className="truncate flex-1 min-w-0" />
          </p>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faCode} className="mr-2 text-gray-500" />
            {isbn}
          </p>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
            {owner}
          </p>
          <TruncatedText
            as="p"
            text={synopsis}
            className="text-gray-600 text-sm mt-2 line-clamp-3 text-pretty"
          />
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
            <IconButton
              aria-label={`Edit book ${title}`}
              onClick={() => editBook?.(id)}
              color="primary"
              size="small"
              className="m-0"
            >
              <FontAwesomeIcon
                icon={faEdit}
              />
            </IconButton>
            <IconButton
              aria-label={`Edit book ${title}`}
              onClick={() => updateShareableStatus?.(id)}
              size="small"
              className="m-0"
            >
              <FontAwesomeIcon
                icon={faShareNodes}
                className="text-green-600"
              />
            </IconButton>
            <IconButton
              aria-label={`Edit book ${title}`}
              onClick={() => updateArchiveStatus?.(id)}
              size="small"
              className="m-0"
            >
              <FontAwesomeIcon
                icon={faBoxArchive}
                className="text-yellow-500"
              />
            </IconButton>
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
