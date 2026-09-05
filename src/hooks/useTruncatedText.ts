import { useEffect, useRef, useState } from "react";

/**
 * Detects whether the text rendered inside the returned ref element is
 * currently truncated (either via single-line `truncate` ellipsis styles or
 * multi-line `line-clamp` styles). Useful for conditionally displaying a
 * tooltip with the full text only when it is actually cut off.
 */
export function useTruncatedText<T extends HTMLElement>(value?: string) {
    const ref = useRef<T | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            setIsTruncated(false);
            return;
        }

        const checkTruncation = () => {
            const truncatedWidth = el.scrollWidth > el.clientWidth;
            const truncatedHeight = el.scrollHeight > el.clientHeight;
            setIsTruncated(truncatedWidth || truncatedHeight);
        };

        checkTruncation();

        window.addEventListener("resize", checkTruncation);
        return () => window.removeEventListener("resize", checkTruncation);
    }, [value]);

    return { ref, isTruncated };
}

export default useTruncatedText;