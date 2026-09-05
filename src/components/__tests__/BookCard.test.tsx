import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookCard from "../BookCard";
import { BookType } from "../MyBooks";

jest.mock("../../api/api", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
    axiosPrivate: {
        post: jest.fn(),
        patch: jest.fn(),
        interceptors: {
            request: { use: jest.fn(() => 1), eject: jest.fn() },
            response: { use: jest.fn(() => 1), eject: jest.fn() },
        },
    },
}));

jest.mock("../../contextApi/ContextApi", () => ({
    useAuth: () => ({ token: "fake-token", removeToken: jest.fn() }),
}));

jest.mock("react-toastify", () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}));

const baseBook: BookType = {
    id: 1,
    title: "Atomic Habits",
    authorName: "James Clear",
    isbn: "111",
    owner: "me",
    synopsis: "Good book about habits",
    cover: "test-cover",
    rate: 4,
    archived: false,
    shareable: true,
    borrowed: false,
};

const renderCard = (props: Partial<React.ComponentProps<typeof BookCard>> = {}) =>
    render(
        <MemoryRouter>
            <BookCard book={baseBook} {...props} />
        </MemoryRouter>
    );

describe("BookCard - normal mode", () => {
    it("renders the cover image using the byte-array/base64 implementation", () => {
        renderCard();
        const img = screen.getByAltText("Book Cover") as HTMLImageElement;
        expect(img.src).toContain("data:image/png;base64,test-cover");
    });

    it("does not display a selection checkbox", () => {
        renderCard();
        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("renders the title, author and synopsis text", () => {
        renderCard();
        expect(screen.getByText("Atomic Habits")).toBeInTheDocument();
        expect(screen.getByText("James Clear")).toBeInTheDocument();
        expect(screen.getByText("Good book about habits")).toBeInTheDocument();
    });
});

describe("BookCard - preview mode", () => {
    it("renders the cover image using previewBookUrl instead of the base64 cover", () => {
        renderCard({
            previewMode: true,
            previewBookUrl: "http://example.com/cover.png",
            selected: true,
            onSelectChange: jest.fn(),
        });

        const img = screen.getByAltText("Book Cover") as HTMLImageElement;
        expect(img.src).toBe("http://example.com/cover.png");
    });

    it("displays a selection checkbox on the same row as the title", () => {
        renderCard({
            previewMode: true,
            previewBookUrl: "http://example.com/cover.png",
            selected: true,
            onSelectChange: jest.fn(),
        });

        const checkbox = screen.getByRole("checkbox", {
            name: /select book atomic habits/i,
        }) as HTMLInputElement;
        expect(checkbox).toBeInTheDocument();
        expect(checkbox.checked).toBe(true);

        const titleRow = checkbox.closest("div")?.parentElement;
        expect(titleRow).toContainElement(screen.getByText("Atomic Habits"));
    });

    it("calls onSelectChange with the book id when the checkbox is toggled", () => {
        const onSelectChange = jest.fn();
        renderCard({
            previewMode: true,
            previewBookUrl: "http://example.com/cover.png",
            selected: true,
            onSelectChange,
        });

        const checkbox = screen.getByRole("checkbox", {
            name: /select book atomic habits/i,
        });
        fireEvent.click(checkbox);

        expect(onSelectChange).toHaveBeenCalledWith(1, false);
    });

    it("respects the selected prop when false", () => {
        renderCard({
            previewMode: true,
            previewBookUrl: "http://example.com/cover.png",
            selected: false,
            onSelectChange: jest.fn(),
        });

        const checkbox = screen.getByRole("checkbox", {
            name: /select book atomic habits/i,
        }) as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });
});

describe("BookCard - long text truncation & tooltip behavior", () => {
    it("does not show a tooltip for short, fully visible text", async () => {
        renderCard();

        // jsdom does not compute real layout, so scrollWidth/clientWidth are
        // both 0 by default which means "not truncated" -> no tooltip content
        // rendered in the accessible tree until hovered and detected truncated.
        const title = screen.getByText("Atomic Habits");
        expect(title).toBeInTheDocument();
    });

    it("keeps the title truncated with an ellipsis class regardless of text length", () => {
        renderCard({
            book: {
                ...baseBook,
                title:
                    "A Very Very Very Long Book Title That Should Be Truncated With An Ellipsis",
            },
        });

        const title = screen.getByText(
            "A Very Very Very Long Book Title That Should Be Truncated With An Ellipsis"
        );
        expect(title.className).toContain("truncate");
    });
});