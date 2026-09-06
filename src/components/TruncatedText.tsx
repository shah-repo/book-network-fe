import { Tooltip } from "@mui/material";
import React, { ElementType, useEffect, useRef, useState } from "react";

interface TruncatedTextProps {
  text?: string;
  className?: string;
  as?: ElementType;
  multiline?: boolean;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text = "",
  className = "",
  as: Component = "span",
  multiline = false,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;

    const checkTruncation = () => {
      if (!element) {
        return;
      }

      if (multiline) {
        setIsTruncated(element.scrollHeight > element.clientHeight + 1);
      } else {
        setIsTruncated(element.scrollWidth > element.clientWidth + 1);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [text, multiline]);

  const truncateClass = multiline ? "line-clamp-3" : "truncate";

  const content = (
    <Component ref={ref} className={`${className} ${truncateClass}`.trim()}>
      {text}
    </Component>
  );

  if (!text || !isTruncated) {
    return content;
  }

  return (
    <Tooltip title={text} arrow>
      {content}
    </Tooltip>
  );
};

export default TruncatedText;