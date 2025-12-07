import { type Header } from "@tanstack/react-table";
import { type EquipmentItem } from "~/server/db/types";

export const ColumnResizer = ({
  header,
}: {
  header: Header<EquipmentItem, unknown>;
}) => {
  if (header.column.getCanResize() === false) return <></>;

  return (
    <div
      {...{
        onMouseDown: header.getResizeHandler(),
        onTouchStart: header.getResizeHandler(),
        className: `absolute top-0 right-0 cursor-col-resize w-px h-full bg-muted hover:bg-black/50 dark:hover:bg-white/50 hover:w-[2px]`,
        style: {
          userSelect: "none",
          touchAction: "none",
        },
      }}
    />
  );
};