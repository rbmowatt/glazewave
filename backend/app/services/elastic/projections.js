'use strict';

// The projections the two indexes are built from.
//
// BetterQueue writes these on create/update and backfill_elastic re-runs them
// over the whole table. They used to be copy-pasted into both files with a
// comment asking future readers to keep them in step; they did not stay in
// step, which is how the canonical sessions mapping ended up without the
// `pressure` field the query has always selected.
//
// Every column here must have a matching field in elastic/indexes/*.json.
// Anything unmapped gets dynamically typed off the first document, and the
// carefully configured analyzers never apply to it.

// Coordinates are emitted as a JSON object rather than an array or a string
// because the two orderings disagree: GeoJSON is [lon, lat] and Elasticsearch's
// string form is "lat,lon". Getting that backwards is exactly what left the
// locations.geo GEOMETRY column holding inverted points. locations.lat/lng are
// VARCHAR, so they need the cast and the empty-string guard.
const LOCATION_POINT = `
  CASE WHEN NULLIF(locations.lat, '') IS NOT NULL
        AND NULLIF(locations.lng, '') IS NOT NULL
       THEN JSON_OBJECT('lat', CAST(locations.lat AS DECIMAL(10, 7)),
                        'lon', CAST(locations.lng AS DECIMAL(10, 7)))
  END AS location_point`;

// Dimensions here are the catalog model's nominal figures, not the board that
// was actually ridden: a 5'10 and a 6'4 of one model are different boards.
// dims_source records that, so a query can tell nominal from measured. Once
// user_boards.size is parsed into numeric columns this becomes
// COALESCE(user_boards.volume_l, boards.volume_l) and the value flips to
// 'user' - a SQL change and a backfill, not a mapping change.
const DIMS_SOURCE = `
  CASE WHEN boards.id IS NULL THEN NULL ELSE 'catalog' END`;

const SESSION_SELECT = `
  SELECT sessions.id,
         sessions.user_id,
         sessions.title,
         sessions.notes,
         sessions.rating,
         sessions.is_public,
         sessions.session_date,
         sessions.location_id,
         locations.name AS location,
         ${LOCATION_POINT},
         sessions.board_id,
         user_boards.name AS board,
         boards.model,
         boards.category,
         manufacturers.name AS manufacturer,
         boards.length_in AS board_length_in,
         boards.width_in AS board_width_in,
         boards.thickness_in AS board_thickness_in,
         boards.volume_l AS board_volume_l,
         ${DIMS_SOURCE} AS board_dims_source,
         session_data.water_temperature,
         session_data.swell_height,
         session_data.swell_period,
         session_data.wave_height,
         session_data.wave_period,
         session_data.pressure,
         session_data.wind_speed
    FROM sessions
    LEFT JOIN session_data ON sessions.id = session_data.session_id
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN boards ON boards.id = user_boards.board_id
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id
    LEFT JOIN locations ON locations.id = sessions.location_id`;

const USER_BOARD_SELECT = `
  SELECT user_boards.id,
         user_boards.user_id,
         user_boards.name,
         user_boards.size,
         user_boards.rating,
         user_boards.is_public,
         user_boards.notes,
         user_boards.board_id,
         boards.manufacturer_id,
         boards.model,
         boards.category,
         boards.year_introduced,
         manufacturers.name AS manufacturer,
         boards.length_in,
         boards.width_in,
         boards.thickness_in,
         boards.volume_l,
         ${DIMS_SOURCE} AS dims_source
    FROM user_boards
    LEFT JOIN boards ON boards.id = user_boards.board_id
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id`;

module.exports = {
  // BetterQueue indexes the rows it was handed; backfill sweeps the table.
  SESSION_SQL: `${SESSION_SELECT} WHERE sessions.id IN (:ids)`,
  USER_BOARD_SQL: `${USER_BOARD_SELECT} WHERE user_boards.id IN (:ids)`,
  SESSION_BACKFILL_SQL: SESSION_SELECT,
  USER_BOARD_BACKFILL_SQL: USER_BOARD_SELECT,
};
