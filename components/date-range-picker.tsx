"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangeValue = {
  from?: Date;
  to?: Date;
};

export function DateRangePicker({
  date,
  onDateChange,
  label,
  placeholder = "Pick a date",
  id: idProp,
  className,
  fieldClassName,
  buttonClassName,
}: {
  date: DateRangeValue | undefined;
  onDateChange: (next: DateRangeValue | undefined) => void;
  /** Omit or pass empty string to hide the field label (toolbar-style). */
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  fieldClassName?: string;
  buttonClassName?: string;
}) {
  const uid = React.useId();
  const triggerId = idProp ?? `date-range-${uid}`;
  const selected =
    date?.from || date?.to ? { from: date.from, to: date.to } : undefined;

  const showLabel = Boolean(label?.trim());

  return (
    <Field className={cn(className, fieldClassName)}>
      {showLabel ? (
        <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
      ) : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={triggerId}
            aria-label={
              showLabel
                ? undefined
                : "Select booking date range"
            }
            className={cn(
              "justify-start px-2.5 font-normal",
              !date?.from && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} –{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={selected}
            onSelect={(range) => {
              if (!range?.from && !range?.to) {
                onDateChange(undefined);
                return;
              }
              onDateChange({
                from: range.from,
                to: range.to,
              });
            }}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

/** Field + summary + range calendar — use inside an existing popover (no nested Popover). */
export function DateRangePickerInline({
  date,
  onDateChange,
  label = "Filter by booking date (range)",
  id: idProp,
  className,
}: {
  date: DateRangeValue | undefined;
  onDateChange: (next: DateRangeValue | undefined) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  const uid = React.useId();
  const regionId = idProp ?? `date-range-inline-${uid}`;
  const selected =
    date?.from || date?.to ? { from: date.from, to: date.to } : undefined;

  return (
    <Field className={cn("gap-2", className)}>
      <FieldLabel id={`${regionId}-label`}>{label}</FieldLabel>
      <div
        id={regionId}
        role="group"
        aria-labelledby={`${regionId}-label`}
        className="flex flex-col gap-2"
      >
        <div className="text-muted-foreground flex min-h-9 items-center gap-2 rounded-md border border-border/80 bg-muted/30 px-2.5 py-1.5 text-xs">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate font-normal">
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} –{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span className="text-muted-foreground">Pick a date range</span>
            )}
          </span>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          defaultMonth={date?.from ?? date?.to}
          onSelect={(range) => {
            if (!range?.from && !range?.to) {
              onDateChange(undefined);
              return;
            }
            onDateChange({
              from: range.from,
              to: range.to,
            });
          }}
          initialFocus
        />
      </div>
    </Field>
  );
}
