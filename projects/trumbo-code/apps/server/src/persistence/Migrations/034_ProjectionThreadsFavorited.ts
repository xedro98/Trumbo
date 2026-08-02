import * as Effect from "effect/Effect";
import * as SqlClient from "effect/unstable/sql/SqlClient";

/**
 * Thread favorite bookmarking (sidebar pin + sort-to-top).
 *
 * `projection_threads.favorited_at`  TEXT -- IsoDateTime when the thread was
 * favorited; NULL (the default) = not favorited. Written via the
 * `thread.meta.update` command's `favoritedAt` field.
 */
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    ALTER TABLE projection_threads
    ADD COLUMN favorited_at TEXT
  `;
});
