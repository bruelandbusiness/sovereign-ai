"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  avatar?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanItem[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  className?: string;
  /** Called when a card is moved between (or within) columns. */
  onCardMove?: (
    cardId: string,
    fromColumn: string,
    toColumn: string,
  ) => void;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  SortableCard                                                       */
/* ------------------------------------------------------------------ */

function SortableCard({ item }: { item: KanbanItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={cardVariants}
      whileHover={isDragging ? undefined : { y: -2, borderColor: "rgba(255,255,255,0.12)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-white/[0.06]",
        "bg-white/[0.02] backdrop-blur-sm",
        "p-3 cursor-grab active:cursor-grabbing",
        "touch-none select-none",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent item={item} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CardContent (shared between inline card and drag overlay)          */
/* ------------------------------------------------------------------ */

function CardContent({ item }: { item: KanbanItem }) {
  return (
    <div className="flex items-start gap-3">
      {item.avatar && (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
          <Image
            src={item.avatar}
            alt={`${item.title} avatar`}
            fill
            sizes="28px"
            className="object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/90 truncate">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="mt-0.5 text-xs text-white/40 truncate">
            {item.subtitle}
          </p>
        )}
      </div>

      {item.value && (
        <span className="shrink-0 text-xs font-medium text-white/60">
          {item.value}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DragOverlayCard (the floating card while dragging)                 */
/* ------------------------------------------------------------------ */

function DragOverlayCard({ item }: { item: KanbanItem }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.12]",
        "bg-[#16161e] shadow-2xl shadow-black/60",
        "p-3 cursor-grabbing",
      )}
    >
      <CardContent item={item} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DroppableColumn                                                    */
/* ------------------------------------------------------------------ */

function DroppableColumn({ column }: { column: KanbanColumn }) {
  const itemIds = useMemo(
    () => column.items.map((i) => i.id),
    [column.items],
  );

  return (
    <div className="flex min-w-[240px] flex-1 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-medium text-white/70">
          {column.title}
        </h3>
        <span
          className={cn(
            "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center",
            "rounded-full bg-white/[0.06] px-1.5 text-[11px] font-medium text-white/40",
          )}
        >
          {column.items.length}
        </span>
      </div>

      {/* Column body — acts as a droppable zone */}
      <SortableContext
        id={column.id}
        items={itemIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex-1 rounded-xl border border-white/[0.06]",
            "bg-white/[0.02] p-2 min-h-[80px]",
          )}
          style={{ borderTopColor: column.color, borderTopWidth: 2 }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {column.items.map((item) => (
              <SortableCard key={item.id} item={item} />
            ))}

            {column.items.length === 0 && (
              <p className="py-6 text-center text-xs text-white/20">
                No items
              </p>
            )}
          </motion.div>
        </div>
      </SortableContext>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function findColumnByItemId(
  columns: KanbanColumn[],
  itemId: string,
): KanbanColumn | undefined {
  return columns.find((col) =>
    col.items.some((item) => item.id === itemId),
  );
}

function findItemById(
  columns: KanbanColumn[],
  itemId: string,
): KanbanItem | undefined {
  for (const col of columns) {
    const found = col.items.find((item) => item.id === itemId);
    if (found) return found;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  KanbanBoard                                                        */
/* ------------------------------------------------------------------ */

export function KanbanBoard({
  columns: externalColumns,
  className,
  onCardMove,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(externalColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragSourceColumnRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeItem = activeId ? findItemById(columns, activeId) : undefined;

  /* ------ Drag start ------ */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      const sourceCol = findColumnByItemId(columns, id);
      dragSourceColumnRef.current = sourceCol?.id ?? null;
    },
    [columns],
  );

  /* ------ Drag over (live column transfer) ------ */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    setColumns((prev) => {
      const sourceCol = findColumnByItemId(prev, activeIdStr);
      if (!sourceCol) return prev;

      // Determine destination column: `over` may be a column id or an item id
      let destCol = prev.find((col) => col.id === overIdStr);
      if (!destCol) {
        destCol = findColumnByItemId(prev, overIdStr);
      }
      if (!destCol || sourceCol.id === destCol.id) return prev;

      const item = sourceCol.items.find((i) => i.id === activeIdStr);
      if (!item) return prev;

      // Determine insertion index
      const overIndex = destCol.items.findIndex((i) => i.id === overIdStr);
      const insertIndex = overIndex >= 0 ? overIndex : destCol.items.length;

      return prev.map((col) => {
        if (col.id === sourceCol.id) {
          return {
            ...col,
            items: col.items.filter((i) => i.id !== activeIdStr),
          };
        }
        if (col.id === destCol!.id) {
          const updated = [...col.items];
          updated.splice(insertIndex, 0, item);
          return { ...col, items: updated };
        }
        return col;
      });
    });
  }, []);

  /* ------ Drag end (finalize + callback) ------ */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const fromColumnId = dragSourceColumnRef.current;

      setActiveId(null);
      dragSourceColumnRef.current = null;

      if (!over) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      // Handle reorder within the same column
      setColumns((prev) => {
        const currentCol = findColumnByItemId(prev, activeIdStr);
        if (!currentCol) return prev;

        const overIndex = currentCol.items.findIndex(
          (i) => i.id === overIdStr,
        );
        if (overIndex >= 0 && activeIdStr !== overIdStr) {
          const activeIndex = currentCol.items.findIndex(
            (i) => i.id === activeIdStr,
          );
          const reordered = [...currentCol.items];
          const [moved] = reordered.splice(activeIndex, 1);
          reordered.splice(overIndex, 0, moved);

          return prev.map((col) =>
            col.id === currentCol.id
              ? { ...col, items: reordered }
              : col,
          );
        }

        return prev;
      });

      // Fire onCardMove if the card ended up in a different column.
      // At this point, handleDragOver has already moved the card, so
      // we read the current destination from internal state.
      const destCol = findColumnByItemId(columns, activeIdStr);
      if (
        fromColumnId &&
        destCol &&
        fromColumnId !== destCol.id
      ) {
        onCardMove?.(activeIdStr, fromColumnId, destCol.id);
      }
    },
    [columns, onCardMove],
  );

  if (columns.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        role="region"
        aria-label="Kanban board"
        className={cn("flex gap-4 overflow-x-auto pb-2", className)}
      >
        {columns.map((column) => (
          <DroppableColumn key={column.id} column={column} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? <DragOverlayCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
