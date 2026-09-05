import { fireEvent, render, screen } from "@testing-library/react";
import SectionHeading from "../SectionHeading";
import { TitlePlacement } from "../SectionHeading/types";

describe("SectionHeading", () => {
    it("renders both the Add New Book and Add New Books In Bulk buttons with the same styling", () => {
        const onClick = jest.fn();
        const onBulkClick = jest.fn();

        render(
            <SectionHeading
                title="My Books list"
                placement={TitlePlacement.TopLeft}
                onClick={onClick}
                onBulkClick={onBulkClick}
            />
        );

        const addButton = screen.getByRole("button", { name: "Add New Book" });
        const bulkButton = screen.getByRole("button", {
            name: "Add New Books In Bulk",
        });

        expect(addButton).toBeInTheDocument();
        expect(bulkButton).toBeInTheDocument();

        // Same MUI variant/classes applied to both buttons.
        expect(addButton.className).toContain("MuiButton-outlined");
        expect(bulkButton.className).toContain("MuiButton-outlined");

        fireEvent.click(addButton);
        expect(onClick).toHaveBeenCalledTimes(1);

        fireEvent.click(bulkButton);
        expect(onBulkClick).toHaveBeenCalledTimes(1);
    });

    it("does not render the bulk upload button when onBulkClick is not provided", () => {
        render(
            <SectionHeading
                title="My Books list"
                placement={TitlePlacement.TopLeft}
                onClick={jest.fn()}
            />
        );

        expect(
            screen.queryByRole("button", { name: "Add New Books In Bulk" })
        ).not.toBeInTheDocument();
    });
});