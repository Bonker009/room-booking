import {
  migrateBookingsFromJson,
  parseMigrateCliArgs,
  printMigrateHelp,
} from "../lib/migrate-bookings-json";

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printMigrateHelp();
  }

  try {
    const options = parseMigrateCliArgs(args);
    const result = migrateBookingsFromJson(options);

    console.log(`[migrate:bookings] ${result.message}`);
    console.log(
      `[migrate:bookings] json=${result.jsonPath} db=${result.dbPath} mode=${result.mode}`,
    );
    console.log(
      `[migrate:bookings] totalInJson=${result.totalInJson} imported=${result.imported} skipped=${result.skipped} existingBefore=${result.existingBefore}${result.dryRun ? " (dry-run)" : ""}`,
    );

    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[migrate:bookings] Failed: ${message}`);
    process.exit(1);
  }
}

main();
  