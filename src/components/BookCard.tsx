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

interface TruncatedTextProps {
  text: string;
  className?: string;
  isMultiLine?: boolean;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  className = "",
  isMultiLine = false,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const checkTruncation = () => {
    const el = textRef.current;
    if (!el) return;
    if (isMultiLine) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    } else {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  };

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (isMultiLine) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    } else {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [text, isMultiLine]);

  const handleMouseEnter = () => {
    checkTruncation();
  };

  return (
    <Tooltip title={isTruncated ? text : ""} disableHoverListener={!isTruncated}>
      <span
        ref={textRef}
        onMouseEnter={handleMouseEnter}
        className={`${isMultiLine
          ? "line-clamp-3 text-pretty overflow-hidden block"
          : "truncate block"
          } ${className}`}
        style={
          isMultiLine
            ? {
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }
            : undefined
        }
      >
        {text}
      </span>
    </Tooltip>
  );
};

export interface BookCardProps {
  book: BookType & { previewBookUrl?: string };
  editBook?: (bookId: number) => void;
  fetchAllMyBooks?: () => void;
  isOwner?: boolean;
  isPreview?: boolean;
  isSelected?: boolean;
  onSelectToggle?: (isSelected: boolean) => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  editBook,
  fetchAllMyBooks,
  isOwner,
  isPreview = false,
  isSelected = true,
  onSelectToggle,
}) => {
  const {
    id,
    cover,
    title,
    authorName,
    isbn,
    owner,
    synopsis,
    rate = 0,
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
      data-testid={id ? `book-card-${id}` : "book-card-preview"}
      className={`relative flex flex-col justify-between bg-white shadow-lg rounded-lg ${isBorrowed
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
          src={isPreview ? previewBookUrl || "" : `data:image/png;base64,${cover}`}
          alt={"Book Cover"}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <FontAwesomeIcon icon={faBook} className="mr-2 text-gray-600 flex-shrink-0" />
              <TruncatedText text={title} className="font-bold text-gray-900" />
            </div>
            {isPreview && (
              <Checkbox
                checked={isSelected}
                onChange={(e) => onSelectToggle?.(e.target.checked)}
                inputProps={{ "aria-label": `Select ${title}` }}
                size="small"
                sx={{ padding: 0 }}
                className="flex-shrink-0 p-0"
              />
            )}
          </div>
          <p className="text-gray-700 text-sm flex items-center mt-1 min-w-0">
            <FontAwesomeIcon icon={faAt} className="mr-2 text-gray-500 flex-shrink-0" />
            <TruncatedText text={authorName} />
          </p>
          <p className="text-gray-700 text-sm flex items-center mt-1 min-w-0">
            <FontAwesomeIcon icon={faCode} className="mr-2 text-gray-500 flex-shrink-0" />
            <span className="truncate">{isbn}</span>
          </p>
          {owner && (
            <p className="text-gray-700 text-sm flex items-center mt-1 min-w-0">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">{owner}</span>
            </p>
          )}
          <div className="text-gray-600 text-sm mt-2">
            <TruncatedText text={synopsis} isMultiLine />
          </div>
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
              onClick={() => id !== undefined && editBook?.(id)}
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
              onClick={() => id !== undefined && updateShareableStatus?.(id)}
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
              onClick={() => id !== undefined && updateArchiveStatus?.(id)}
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
