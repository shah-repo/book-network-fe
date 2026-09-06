import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../../contextApi/ContextApi";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import BookCard from "../BookCard";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

jest.mock("../../contextApi/ContextApi", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../hooks/useAxiosPrivate", () => ({
  useAxiosPrivate: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/my-books" }),
}));

const baseBook = {
  id: 1,
  title: "Atomic Habits",
  authorName: "James Clear",
  isbn: "111",
  owner: "me",
  synopsis: "Good habits",
  cover: "cover-1",
  rate: 4,
  archived: false,
  shareable: true,
};

describe("BookCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ removeToken: mockRemoveToken });
    (useAxiosPrivate as jest.Mock).mockReturnValue({
      post: jest.fn(),
      patch: jest.fn(),
    });
  });

  describe("normal mode", () => {
    it("renders the book cover using the base64 image implementation", () => {
      render(<BookCard book={baseBook} isOwner />);

      const image = screen.getByAltText("Book Cover") as HTMLImageElement;
      expect(image.src).toContain("data:image/png;base64,cover-1");
    });

    it("does not render a selection checkbox", () => {
      render(<BookCard book={baseBook} isOwner />);

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("renders the owner and rating/actions section", () => {
      render(<BookCard book={baseBook} isOwner />);

      expect(screen.getByText("me")).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /edit book atomic habits/i })
          .length
      ).toBeGreaterThan(0);
    });
  });

  describe("preview mode", () => {
    const previewBook = {
      id: 1,
      title: "Atomic Habits",
      authorName: "James Clear",
      isbn: "111",
      synopsis: "Good habits",
      shareable: true,
    };

    it("renders the cover image using previewBookUrl instead of the byte-array cover", () => {
      render(
        <BookCard
          book={previewBook}
          isPreview
          previewImageUrl="https://example.com/cover.png"
          selected
        />
      );

      const image = screen.getByAltText("Book Cover") as HTMLImageElement;
      expect(image.src).toBe("https://example.com/cover.png");
    });

    it("renders a selection checkbox on the title row that is checked by default", () => {
      render(
        <BookCard
          book={previewBook}
          isPreview
          previewImageUrl="https://example.com/cover.png"
          selected
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("calls onSelectToggle with the book id and new checked state", async () => {
      const user = userEvent.setup();
      const onSelectToggle = jest.fn();

      render(
        <BookCard
          book={previewBook}
          isPreview
          previewImageUrl="https://example.com/cover.png"
          selected
          onSelectToggle={onSelectToggle}
        />
      );

      await user.click(screen.getByRole("checkbox"));

      expect(onSelectToggle).toHaveBeenCalledWith(1, false);
    });

    it("does not render the owner row or the rating/actions section", () => {
      render(
        <BookCard
          book={previewBook}
          isPreview
          previewImageUrl="https://example.com/cover.png"
          selected
        />
      );

      expect(
        screen.queryByRole("button", { name: /edit book/i })
      ).not.toBeInTheDocument();
    });
  });
});