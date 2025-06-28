"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 bg-white rounded-lg shadow-sm border border-gray-200",
        className,
      )}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
        caption_label:
          "text-lg font-semibold text-gray-900 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-8 w-8 bg-white border border-gray-200 rounded-full hover:bg-gradient-to-r hover:from-sky-500 hover:to-indigo-500 hover:text-white hover:border-transparent transition-all duration-200 hover:shadow-md hover:scale-105 p-0 opacity-80 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex mb-2",
        head_cell:
          "text-gray-600 rounded-md w-10 h-8 font-semibold text-sm flex items-center justify-center uppercase tracking-wide",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 h-10 w-10 transition-all duration-200",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg",
        ),
        day: cn(
          "h-10 w-10 p-0 font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-sky-100 hover:to-indigo-100 hover:text-sky-800 transition-all duration-200 hover:scale-105 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-gradient-to-r aria-selected:from-sky-500 aria-selected:to-indigo-500 aria-selected:text-white aria-selected:shadow-md",
        day_range_end:
          "day-range-end aria-selected:bg-gradient-to-r aria-selected:from-sky-500 aria-selected:to-indigo-500 aria-selected:text-white aria-selected:shadow-md",
        day_selected:
          "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600 focus:from-sky-600 focus:to-indigo-600 shadow-md font-semibold scale-105",
        day_today:
          "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 font-semibold border border-orange-200 shadow-sm",
        day_outside:
          "day-outside text-gray-400 opacity-50 hover:text-gray-600 aria-selected:bg-gray-100 aria-selected:text-gray-600",
        day_disabled:
          "text-gray-300 opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-300 hover:scale-100",
        day_range_middle:
          "aria-selected:bg-gradient-to-r aria-selected:from-sky-100 aria-selected:to-indigo-100 aria-selected:text-sky-800",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("h-4 w-4", className)} {...props} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
