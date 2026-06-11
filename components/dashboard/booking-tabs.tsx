"use client";

import { BookOpen, CalendarIcon, Clock, Filter, User } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BookingTabs({ activeTab, onTabChange }: BookingTabsProps) {
  const triggerClass =
    "shrink-0 min-h-10 flex-none items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 ease-out hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent";

  return (
    <div className="mb-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="scrollbar-brand flex h-auto w-full flex-nowrap items-stretch justify-start gap-0 overflow-x-auto overflow-y-hidden rounded-none border-0 border-b border-border bg-transparent p-0 text-foreground">
          <TabsTrigger value="today" className={triggerClass}>
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span>Today</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className={triggerClass}>
            <Clock className="h-4 w-4 shrink-0" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="past" className={triggerClass}>
            <Filter className="h-4 w-4 shrink-0" />
            <span>Past</span>
          </TabsTrigger>
          <TabsTrigger value="mine" className={triggerClass}>
            <User className="h-4 w-4 shrink-0" />
            <span>My bookings</span>
          </TabsTrigger>
          <TabsTrigger value="all" className={triggerClass}>
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>All Bookings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
