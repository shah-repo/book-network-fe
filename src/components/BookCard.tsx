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
import React, { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contextApi/ContextApi";
import { useAxiosPrivate } from "../hooks/useAxiosPrivate";
import { BookType } from "./MyBooks";

export interface BookCardProps {
  book: BookType & { previewBookUrl?: string };
  editBook?: (bookId: number) => void;
  fetchAllMyBooks?: () => void;
  isOwner?: boolean;
  isPreview?: boolean;
  mode?: "normal" | "preview";
  selected?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onToggleSelect?: (selected?: boolean) => void;
  onSelectionChange?: (selected: boolean) => void;
 }

interface TruncatedFieldProps {
  text: string;
  className?: string;
  as?: "h3" | "p" | "span";
  isMultiLine?: boolean;
}

const TruncatedField: React.FC<TruncatedFieldProps> = ({
  text = "",
  className = "",
  as: Component = "span",
  isMultiLine = false,
}) => {
  const textRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = textRef.current;
    if (!el) return false;
    if (isMultiLine) {
      if (el.scrollHeight > 0 || el.clientHeight > 0) {
        return el.scrollHeight > el.clientHeight;
      }
      return text.length > 100;
    } else {
      if (el.scrollWidth > 0 || el.clientWidth > 0) {
        return el.scrollWidth > el.clientWidth;
      }
      return text.length > 25;
    }
  }, [text, isMultiLine]);

  const handleMouseEnter = () => {
    if (checkOverflow()) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <Tooltip
      title={text}
      open={isOpen}
      onClose={handleMouseLeave}
      disableHoverListener
      disableFocusListener
      disableTouchListener
      arrow
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 4],
              },
            },
          ],
        },
      }}
    >
      <Component
        ref={textRef as unknown as React.Ref<HTMLHeadingElement>}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseOut={handleMouseLeave}
      >
        {text}
      </Component>
    </Tooltip>
  );
};

const BookCard: React.FC<BookCardProps> = ({
  book,
  editBook,
  fetchAllMyBooks,
  isOwner,
  isPreview = false,
  mode = "normal",
  selected,
  isSelected,
  onSelect,
  onToggleSelect,
  onSelectionChange,
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
  } = book;
  const isPreviewMode = mode === "preview" || !!isPreview;
  const isBookSelected =
    selected !== undefined ? selected : isSelected !== undefined ? isSelected : true;

  const handleToggle = (checked: boolean) => {
    onToggleSelect?.(checked);
    onSelect?.(checked);
    onSelectionChange?.(checked);
  };
  const { removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  const borrowBook = async () => {
    if (!id) return;
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
      data-testid={id !== undefined ? `book-card-${id}` : "book-card"}
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
          src={
            isPreviewMode
              ? book.previewBookUrl || ""
              : cover?.startsWith("data:")
              ? cover
              : `data:image/png;base64,${cover}`
          }
          alt={"Book Cover"}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center min-w-0 flex-1 mr-2">
              <FontAwesomeIcon icon={faBook} className="mr-2 text-gray-600 flex-shrink-0" />
              <TruncatedField
                text={title}
                className="font-bold truncate min-w-0"
                as="h3"
              />
            </div>
            {isPreviewMode && (
              <Checkbox
                checked={isBookSelected}
                onChange={(e) => handleToggle(e.target.checked)}
                size="small"
                className="p-0 flex-shrink-0"
                inputProps={{ "aria-label": `Select ${title}` }}
              />
            )}
          </div>
          <div className="text-gray-700 text-sm flex items-center mt-1 min-w-0">
            <FontAwesomeIcon icon={faAt} className="mr-2 text-gray-500 flex-shrink-0" />
            <TruncatedField
              text={authorName}
              className="truncate min-w-0 flex-1"
              as="span"
            />
          </div>
          <p className="text-gray-700 text-sm flex items-center mt-1">
            <FontAwesomeIcon icon={faCode} className="mr-2 text-gray-500 flex-shrink-0" />
            {isbn}
          </p>
          {owner && (
            <p className="text-gray-700 text-sm flex items-center mt-1">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500 flex-shrink-0" />
              {owner}
            </p>
          )}
          <TruncatedField
            text={synopsis}
            className="text-gray-600 text-sm mt-2 line-clamp-3 text-pretty"
            as="p"
            isMultiLine
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
                i + 0.5 === (rate ?? 0)
                  ? faStarHalfAlt
                  : i < (rate ?? 0)
                    ? faStar
                    : faStarHalfAlt
              }
              className={`text-${i < (rate ?? 0) ? "yellow-500" : "gray-300"} mr-1`}
            />
          ))}
          <span className="ml-2 text-sm font-semibold">{rate ?? 0}</span>
        </div>
        {!isPreviewMode && (
          isOwner ? (
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
          )
        )}
      </div>
    </div>
  );
};

export default BookCard;
