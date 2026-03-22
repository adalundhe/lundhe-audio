import { type Header } from "@tanstack/react-table";

export const ColumnResizer = <TData,>({
  header,
  enabled = true,
}: {
  header: Header<TData, unknown>;
  enabled?: boolean;
}) => {
  if (header.column.getCanResize() === false || !enabled) return <></>;

  return (
    <div
      {...{
        onMouseDown: header.getResizeHandler(),
        onTouchStart: header.getResizeHandler(),
        className:
          "absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize bg-transparent after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-muted after:transition-colors hover:after:bg-black/50 dark:hover:after:bg-white/50",
        style: {
          userSelect: "none",
          touchAction: "none",
        },
      }}
    />
  );
};
