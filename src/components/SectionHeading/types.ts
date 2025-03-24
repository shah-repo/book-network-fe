export enum TitlePlacement {
  TopLeft = "top-left",
  Middle = "middle",
}

export interface SectionHeadingProps {
  title: string;
  placement?: TitlePlacement;
  onClick?: () => void;
}
