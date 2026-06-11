import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";

import type { Booking, RecurringPattern } from "@/lib/booking-model";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "bookings.db");
const LEGACY_JSON_PATH = path.join(DATA_DIR, "bookings.json");

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    migrateFromJsonIfNeeded();
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      groupName TEXT NOT NULL,
      className TEXT NOT NULL,
      bookedBy TEXT,
      bookedByEmail TEXT,
      purpose TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      description TEXT,
      attendees INTEGER,
      recurring TEXT,
      status TEXT DEFAULT 'confirmed',
      seriesId TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(className, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, startTime);
  `);
}

function rowToBooking(row: Record<string, unknown>): Booking {
  let recurring: RecurringPattern | undefined;
  if (typeof row.recurring === "string" && row.recurring) {
    try {
      recurring = JSON.parse(row.recurring) as RecurringPattern;
    } catch {
      recurring = undefined;
    }
  }

  return {
    id: String(row.id),
    date: String(row.date),
    startTime: String(row.startTime),
    endTime: String(row.endTime),
    groupName: String(row.groupName),
    className: String(row.className),
    bookedBy: row.bookedBy ? String(row.bookedBy) : undefined,
    bookedByEmail: row.bookedByEmail ? String(row.bookedByEmail) : undefined,
    purpose: String(row.purpose),
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    description: row.description ? String(row.description) : undefined,
    recurring,
    status: row.status
      ? (String(row.status) as Booking["status"])
      : undefined,
    seriesId: row.seriesId ? String(row.seriesId) : undefined,
  };
}

function bookingToRow(booking: Booking): Record<string, unknown> {
  return {
    id: booking.id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    groupName: booking.groupName,
    className: booking.className,
    bookedBy: booking.bookedBy ?? null,
    bookedByEmail: booking.bookedByEmail ?? null,
    purpose: booking.purpose,
    createdAt: booking.createdAt ?? null,
    updatedAt: booking.updatedAt ?? null,
    description: booking.description ?? null,
    attendees: null,
    recurring: booking.recurring ? JSON.stringify(booking.recurring) : null,
    status: booking.status ?? "confirmed",
    seriesId: booking.seriesId ?? null,
  };
}

const INSERT_SQL = `
  INSERT INTO bookings (
    id, date, startTime, endTime, groupName, className,
    bookedBy, bookedByEmail, purpose, createdAt, updatedAt,
    description, attendees, recurring, status, seriesId
  ) VALUES (
    @id, @date, @startTime, @endTime, @groupName, @className,
    @bookedBy, @bookedByEmail, @purpose, @createdAt, @updatedAt,
    @description, @attendees, @recurring, @status, @seriesId
  )
`;

function migrateFromJsonIfNeeded(): void {
  if (!existsSync(LEGACY_JSON_PATH)) return;

  const probe = existsSync(DB_PATH) ? new Database(DB_PATH) : null;
  try {
    if (probe) {
      initSchema(probe);
      const count = (
        probe.prepare("SELECT COUNT(*) AS c FROM bookings").get() as { c: number }
      ).c;
      if (count > 0) return;
    }
  } finally {
    probe?.close();
  }

  try {
    const parsed = JSON.parse(readFileSync(LEGACY_JSON_PATH, "utf8")) as Booking[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const db = new Database(DB_PATH);
    try {
      db.pragma("journal_mode = WAL");
      initSchema(db);
      const insert = db.prepare(INSERT_SQL);
      const tx = db.transaction((rows: Booking[]) => {
        for (const booking of rows) {
          insert.run(bookingToRow(booking));
        }
      });
      tx(parsed);
      console.log(
        `[bookings] Migrated ${parsed.length} record(s) from bookings.json to bookings.db`,
      );
    } finally {
      db.close();
    }
  } catch {
    // Invalid JSON or write error — app will start with empty/new DB.
  }
}

export function readAllBookings(): Booking[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM bookings WHERE COALESCE(status, 'confirmed') != 'cancelled' ORDER BY date ASC, startTime ASC",
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToBooking);
}

export function readBookingById(id: string): Booking | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToBooking(row) : null;
}

export function insertBookingRecord(booking: Booking): void {
  const db = getDb();
  db.prepare(INSERT_SQL).run(bookingToRow(booking));
}

export function insertBookingRecords(bookings: Booking[]): void {
  if (bookings.length === 0) return;
  const db = getDb();
  const insert = db.prepare(INSERT_SQL);
  const tx = db.transaction((rows: Booking[]) => {
    for (const booking of rows) {
      insert.run(bookingToRow(booking));
    }
  });
  tx(bookings);
}

export function updateBookingRecord(id: string, patch: Partial<Booking>): Booking | null {
  const db = getDb();
  const existing = readBookingById(id);
  if (!existing) return null;

  const updated: Booking = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE bookings SET
      date = @date,
      startTime = @startTime,
      endTime = @endTime,
      groupName = @groupName,
      className = @className,
      bookedBy = @bookedBy,
      bookedByEmail = @bookedByEmail,
      purpose = @purpose,
      createdAt = @createdAt,
      updatedAt = @updatedAt,
      description = @description,
      attendees = @attendees,
      recurring = @recurring,
      status = @status,
      seriesId = @seriesId
    WHERE id = @id
  `).run(bookingToRow(updated));

  return updated;
}

export function deleteBookingRecord(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
  return result.changes > 0;
}

export function findConflictingBookingRecord(
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    className: string;
  },
  excludeId?: string,
): Booking | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM bookings
       WHERE date = @date
         AND className = @className
         AND (@excludeId IS NULL OR id != @excludeId)
         AND COALESCE(status, 'confirmed') != 'cancelled'
         AND startTime < @endTime
         AND endTime > @startTime
       LIMIT 1`,
    )
    .get({
      date: booking.date,
      className: booking.className,
      startTime: booking.startTime,
      endTime: booking.endTime,
      excludeId: excludeId ?? null,
    }) as Record<string, unknown> | undefined;

  return row ? rowToBooking(row) : null;
}

export function readBookingsBySeriesId(seriesId: string): Booking[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM bookings WHERE seriesId = ? ORDER BY date ASC, startTime ASC`,
    )
    .all(seriesId) as Record<string, unknown>[];
  return rows.map(rowToBooking);
}

export function deleteBookingsBySeriesId(seriesId: string): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM bookings WHERE seriesId = ?").run(seriesId);
  return result.changes;
}

export function readPendingBookings(): Booking[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM bookings WHERE status = 'pending' ORDER BY date ASC, startTime ASC`,
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToBooking);
}

export function readBookingsForDate(date: string): Booking[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM bookings
       WHERE date = ?
         AND COALESCE(status, 'confirmed') != 'cancelled'
       ORDER BY startTime ASC`,
    )
    .all(date) as Record<string, unknown>[];
  return rows.map(rowToBooking);
}
