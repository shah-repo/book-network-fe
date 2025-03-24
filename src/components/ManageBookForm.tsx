import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useForm, Controller } from "react-hook-form";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../api/api";
import { toast } from "react-toastify";
import { useAuth } from "../contextApi/ContextApi";
import { useLocation, useNavigate } from "react-router-dom";
import { BookType } from "./MyBooks";

// Validation Schema using Yup
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  authorName: yup.string().required("Author name is required"),
  isbn: yup.string().required("ISBN is required"),
  synopsis: yup.string().required("Synopsis is required"),
  shareable: yup.boolean(),
});

export interface ManageBookFormProps extends React.RefObject<HTMLButtonElement> {
  data: BookType;
  closeDialog: () => void;
}

const ManageBookForm: React.FC<ManageBookFormProps> = forwardRef(
  (props, ref) => {
    const [fileName, setFileName] = useState<string>("No file chosen");
    const [file, setFile] = useState<File>();
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const { token, removeToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
      control,
      reset,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(schema),
    });

    useEffect(() => {
      if (!props.data) {
        return;
      }

      const defaultValues = { ...props.data };
      const cover = props.data?.cover;
      reset({ ...defaultValues });
      setFilePreview(`data:image/png;base64,${cover}`);
    }, []);

    const saveBook = async (data: BookType) => {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const { data: bookId } = await api.post("/api/v1/books", data, {
          headers,
        });
        reset();
        console.log("Form Data:", { bookId, data });
        if (bookId > 0 && !data.cover) {
          const { data } = await api.post(
            `/api/v1/books/cover/${bookId}`,
            { file },
            {
              headers: {
                ...headers,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          console.log({ data });
        }
        props.closeDialog();
        toast.success("Book Saved Successfull!");
      } catch (error) {
        toast.error("error");
        if (error.status === 403) {
          removeToken();
          navigate("/login", { state: { from: location }, replace: true });
        }
        console.log({ error });
      }
    };

    const onSubmit = (data: any) => {
      console.log("Form Data:", data);
      saveBook(data);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        setFile(file);
        setFileName(file.name);
        setFilePreview(URL.createObjectURL(file));
      }
    };

    // Expose submit function to the parent via ref
    useImperativeHandle(ref, () => ({
      submitForm: () => handleSubmit(onSubmit)(),
    }));

    return (
      <div className="max-w-5xl mx-auto bg-white">
        <form className="flex gap-6">
          {/* Left Side - Image Upload */}
          <div className="flex flex-col items-center w-1/3">
            <div className="w-full h-72 bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Book Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Book Cover Preview</span>
              )}
            </div>
            <div className="mt-3">
              <input
                type="file"
                id="bookImage"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="bookImage"
                className="bg-gray-300 px-4 py-2 rounded cursor-pointer"
              >
                Choose file
              </label>
              <span className="ml-2 text-gray-600 text-sm">{fileName}</span>
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="w-2/3 space-y-4">
            <div className="flex gap-4">
              <div className="w-2/3">
                <Controller
                  name="title"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Title"
                      fullWidth
                      variant="outlined"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <Controller
                  name="authorName"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Author Name"
                      fullWidth
                      variant="outlined"
                      error={!!errors.authorName}
                      helperText={errors.authorName?.message}
                    />
                  )}
                />
              </div>
              <div className="w-1/2">
                <Controller
                  name="isbn"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ISBN"
                      fullWidth
                      variant="outlined"
                      error={!!errors.isbn}
                      helperText={errors.isbn?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Controller
                name="synopsis"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Synopsis"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    error={!!errors.synopsis}
                    helperText={errors.synopsis?.message}
                  />
                )}
              />
            </div>

            {/* Checkbox */}
            <Controller
              name="shareable"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label="Share me"
                />
              )}
            />
          </div>
        </form>
      </div>
    );
  }
);

export default ManageBookForm;
