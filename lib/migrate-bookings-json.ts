import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";

import type { Booking } from "@/lib/booking-model";

const DATA_DIR = path.join(process.cwd(), "data");
const DEFAULT_DB_PATH = path.join(DATA_DIR, "bookings.db");
const DEFAULT_JSON_PATH = path.join(DATA_DIR, "bookings.json");

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

export type MigrateBookingsMode = "if-empty" | "merge" | "replace";

export interface MigrateBookingsOptions {
  jsonPath?: string;
  dbPath?: string;
  mode?: MigrateBookingsMode;
  dryRun?: boolean;
}

export interface MigrateBookingsResult {
  ok: boolean;
  message: string;
  jsonPath: string;
  dbPath: string;
  mode: MigrateBookingsMode;
  dryRun: boolean;
  totalInJson: number;
  imported: number;
  skipped: number;
  existingBefore: number;
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

function isValidBooking(value: unknown): value is Booking {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.date === "string" &&
    typeof b.startTime === "string" &&
    typeof b.endTime === "string" &&
    typeof b.groupName === "string" &&
    typeof b.className === "string" &&
    typeof b.purpose === "string"
  );
}

function loadJsonBookings(jsonPath: string): Booking[] {
  const raw = readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("bookings.json must contain a JSON array");
  }
  const valid = parsed.filter(isValidBooking);
  if (valid.length !== parsed.length) {
    console.warn(
      `[migrate:bookings] Skipped ${parsed.length - valid.length} invalid record(s) in JSON`,
    );
  }
  return valid;
}

export function parseMigrateCliArgs(argv: string[]): MigrateBookingsOptions {
  const options: MigrateBookingsOptions = { mode: "merge" };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--replace") {
      options.mode = "replace";
    } else if (arg === "--merge") {
      options.mode = "merge";
    } else if (arg === "--if-empty") {
      options.mode = "if-empty";
    } else if (arg.startsWith("--json=")) {
      options.jsonPath = arg.slice("--json=".length);
    } else if (arg.startsWith("--db=")) {
      options.dbPath = arg.slice("--db=".length);
    } else if (arg === "--help" || arg === "-h") {
      printMigrateHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

export function printMigrateHelp(): void {
  console.log(`Migrate bookings from JSON to SQLite

Usage:
  npm run migrate:bookings [-- options]

Options:
  --merge       Insert records whose id is not already in the DB (default)
  --replace     Delete all rows, then import every record from JSON
  --if-empty    Import only when the database has zero bookings
  --dry-run     Show what would happen without writing
  --json=PATH   Source JSON file (default: data/bookings.json)
  --db=PATH     Target SQLite file (default: data/bookings.db)
  -h, --help    Show this help
`);
}

export function migrateBookingsFromJson(
  options: MigrateBookingsOptions = {},
): MigrateBookingsResult {
  const jsonPath = path.resolve(options.jsonPath ?? DEFAULT_JSON_PATH);
  const dbPath = path.resolve(options.dbPath ?? DEFAULT_DB_PATH);
  const mode = options.mode ?? "merge";
  const dryRun = Boolean(options.dryRun);

  const base: MigrateBookingsResult = {
    ok: false,
    message: "",
    jsonPath,
    dbPath,
    mode,
    dryRun,
    totalInJson: 0,
    imported: 0,
    skipped: 0,
    existingBefore: 0,
  };

  if (!existsSync(jsonPath)) {
    return {
      ...base,
      message: `JSON file not found: ${jsonPath}`,
    };
  }

  const records = loadJsonBookings(jsonPath);
  base.totalInJson = records.length;

  if (records.length === 0) {
    return {
      ...base,
      ok: true,
      message: "JSON file is empty — nothing to import",
    };
  }

  if (!existsSync(path.dirname(dbPath))) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  try {
    if (db) {
      db.pragma("journal_mode = WAL");
      initSchema(db);
    }

    const existingBefore = db
      ? (db.prepare("SELECT COUNT(*) AS c FROM bookings").get() as { c: number })
          .c
      : 0;
    base.existingBefore = existingBefore;

    if (mode === "if-empty" && existingBefore > 0) {
      return {
        ...base,
        ok: true,
        skipped: records.length,
        message: `Database already has ${existingBefore} booking(s) — skipped import`,
      };
    }

    const existingIds = new Set(
      (
        db!
          .prepare("SELECT id FROM bookings")
          .all() as { id: string }[]
      ).map((row) => row.id),
    );

    if (mode === "replace") {
      base.imported = records.length;
      base.skipped = 0;
    } else {
      for (const booking of records) {
        if (existingIds.has(booking.id)) {
          base.skipped += 1;
        } else {
          base.imported += 1;
        }
      }
    }

    if (dryRun) {
      return {
        ...base,
        ok: true,
        message: `Dry run: would import ${base.imported} record(s), skip ${base.skipped} (${mode})`,
      };
    }

    const insert = db!.prepare(INSERT_SQL);

    const tx = db!.transaction((rows: Booking[]) => {
      if (mode === "replace") {
        db!.prepare("DELETE FROM bookings").run();
        existingIds.clear();
      }

      base.imported = 0;
      base.skipped = 0;

      for (const booking of rows) {
        if (
          (mode === "merge" || mode === "if-empty") &&
          existingIds.has(booking.id)
        ) {
          base.skipped += 1;
          continue;
        }
        insert.run(bookingToRow(booking));
        existingIds.add(booking.id);
        base.imported += 1;
      }
    });

    tx(records);

    base.ok = true;
    base.message = `Imported ${base.imported} record(s) from JSON (${base.skipped} skipped)`;
    return base;
  } finally {
    db?.close();
  }
}
