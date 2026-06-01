import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROOM_OPTIONS } from "@/lib/rooms";

export function RoomSelect() {
  const { selectedRoomId, setSelectedRoomId } = useCalendar();

  return (
    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
      <SelectTrigger className="flex-1 md:w-48">
        <SelectValue placeholder="Filter by room" />
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="all">All rooms</SelectItem>
        {ROOM_OPTIONS.map((room) => (
          <SelectItem key={room} value={room}>
            {room}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
