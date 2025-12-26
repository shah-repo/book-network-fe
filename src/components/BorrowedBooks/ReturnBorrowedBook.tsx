import React, { forwardRef, useImperativeHandle } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextField, Rating, Box } from "@mui/material";
import { BookType } from "../MyBooks";
import { ReturnBookFormData } from "./types";

interface ReturnBorrowedBookType {
  data: BookType;
  saveFeedbackAndReturn: (
    feedbackData: ReturnBookFormData,
    bookId: number
  ) => void;
}

const ReturnBorrowedBook: React.FC<ReturnBorrowedBookType> = forwardRef(
  ({ data, saveFeedbackAndReturn }, ref) => {
    const {
      handleSubmit,
      control,
      register,
      formState: { errors },
    } = useForm<ReturnBookFormData>();

    const { title, authorName, isbn } = data ?? {};

    const onSubmit = (values: ReturnBookFormData) => {
      console.log("Returned Book Data:", data);
      saveFeedbackAndReturn(values, data.id);
    };

    useImperativeHandle(ref, () => ({
      submitForm: () => handleSubmit(onSubmit)(),
    }));

    return (
      <div className="w-2xl mx-auto bg-white rounded-lg">
        <form className="space-y-4">
          {/* Book Details */}
          <Box display="flex" gap={2}>
            <Box>
              <div>
                <p className="text-lg font-medium">Title:</p>
                <p className="text-lg font-medium">Author:</p>
                <p className="text-lg font-medium">ISBN:</p>
              </div>
            </Box>
            <Box>
              <div className="flex flex-col gap-y-1">
                <span className="font-normal font-serif">{title}</span>
                <span className="font-normal font-serif">{authorName}</span>
                <span className="font-normal font-serif">
                  {isbn ? isbn : "N/A"}
                </span>
              </div>
            </Box>
          </Box>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate the book
            </label>
            <Controller
              name="note"
              control={control}
              defaultValue={0}
              render={({ field }) => <Rating {...field} precision={0.5} />}
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback
            </label>
            <TextField
              {...register("comment", { required: "Feedback is required" })}
              placeholder="Write your feedback..."
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              error={!!errors.comment}
              helperText={errors.comment?.message}
            />
          </div>
        </form>
      </div>
    );
  }
);

export default ReturnBorrowedBook;
