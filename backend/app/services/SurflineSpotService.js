const db = require("../models");
const BaseModel = db.SurflineSpot;
const Op = db.Sequelize.Op;
const BaseService  = require('./BaseService');
const sequelize = require('./sequelize');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const { sameSpotName } = require('./../lib/spot_name');
const roadDistance = require('./RoadDistance');

// How close a new spot has to be to an existing one, with a similar name,
// before it is treated as the same break rather than a new one. Deliberately
// tight: adjacent peaks on one beach are genuinely different spots and
// merging them loses the distinction a surf log exists to record.
const DUPLICATE_RADIUS_M = 75;

/*
 * A name someone types is a literal, so % and _ have to stop being wildcards
 * before they reach LIKE. ! is the escape character rather than a backslash:
 * a backslash stops escaping anything under NO_BACKSLASH_ESCAPES, and that
 * mode is a server setting no query should depend on.
 */
const escapeLike = (value) => String(value).replace(/[!%_]/g, '!$&');

class SurflineSpotService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    /*
     * POINT() takes (x, y), so longitude is the first argument. The geo column
     * on this table was populated with the pair reversed and is deliberately
     * not read here. lat and lon are VARCHAR, and an uncast string compares as
     * 0 rather than raising, which silently puts every spot off West Africa.
     */
    nearestByCrow({ lat, lon, radius, limit })
    {
        const query = `
            SELECT id, name, url, crumbs,
                   CAST(lat AS DECIMAL(10,7)) AS lat,
                   CAST(lon AS DECIMAL(10,7)) AS lon,
                   ST_Distance_Sphere(
                       POINT(CAST(lon AS DECIMAL(10,7)), CAST(lat AS DECIMAL(10,7))),
                       POINT(:lon, :lat)
                   ) AS distance_m
            FROM surfline_spots
            WHERE lat IS NOT NULL AND lon IS NOT NULL AND lat <> '' AND lon <> ''
            HAVING distance_m <= :radius
            ORDER BY distance_m
            LIMIT :limit`;

        return sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { lat, lon, radius, limit },
        });
    }

    /*
     * What /api/spot/nearest answers with. Pulls a wider pool by straight-line
     * distance, then hands it to the router to reorder by how far the surfer
     * actually has to drive.
     *
     * distance_m is road metres when a road ranking was available for these
     * coordinates and straight-line metres when it was not, never a mix inside
     * one response. A cold origin gets straight-line and warms the cache, so
     * the same call can answer in a different order a moment later. The row
     * shape is unchanged either way, so /search returns the same columns.
     */
    async nearest({ lat, lon, radius, limit })
    {
        const pool = await this.nearestByCrow({
            lat, lon, radius, limit: roadDistance.poolSize(limit),
        });
        const ranked = await roadDistance.rank(lat, lon, pool);
        return (ranked || pool).slice(0, limit);
    }

    /*
     * Name search for the location field, distance-ranked when the browser
     * gave up coordinates. Google cannot do the useful half of this: typing
     * "cerritos" from La Paz has to put the Cerritos twenty minutes away above
     * the one in Baja Norte, and only the caller's own position decides that.
     *
     * Accent and case folding come from the column's collation, not from
     * anything here - MySQL 8 defaults to utf8mb4_0900_ai_ci, under which
     * "suenos" finds "Bahia de los Suenos". If the box was initialised with an
     * _as_ or _bin collation this silently gets stricter rather than failing,
     * so confirm it rather than trusting the default.
     */
    search({ q, lat, lon, limit })
    {
        const hasOrigin = Number.isFinite(lat) && Number.isFinite(lon);

        // Without an origin the column is null and the ordering is name alone.
        // Sending POINT(NULL, NULL) instead would make ST_Distance_Sphere
        // return null for every row and sort them arbitrarily.
        const distance = hasOrigin
            ? `ST_Distance_Sphere(
                   POINT(CAST(lon AS DECIMAL(10,7)), CAST(lat AS DECIMAL(10,7))),
                   POINT(:lon, :lat)
               )`
            : 'NULL';

        const query = `
            SELECT id, name, url, crumbs,
                   CAST(lat AS DECIMAL(10,7)) AS lat,
                   CAST(lon AS DECIMAL(10,7)) AS lon,
                   ${distance} AS distance_m
            FROM surfline_spots
            WHERE name IS NOT NULL
              AND name LIKE :contains ESCAPE '!'
              AND lat IS NOT NULL AND lon IS NOT NULL AND lat <> '' AND lon <> ''
            -- The rank stays in ORDER BY rather than the select list so the row
            -- shape matches /nearest exactly; both feed the same components.
            ORDER BY CASE WHEN name LIKE :prefix ESCAPE '!' THEN 0 ELSE 1 END,
                     ${hasOrigin ? 'distance_m' : 'name'}
            LIMIT :limit`;

        const replacements = {
            prefix: `${escapeLike(q)}%`,
            contains: `%${escapeLike(q)}%`,
            limit,
        };
        if (hasOrigin) {
            replacements.lat = lat;
            replacements.lon = lon;
        }

        return sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: replacements,
        });
    }

    /*
     * Photographs riders have logged at this spot, newest first.
     *
     * sessions.location_id holds a surfline_spots primary key for any session
     * logged against a seeded spot: the picker writes the spot id into that
     * column and LocationService.resolve mints the matching locations row with
     * the same id via createFromSpot. So this is a plain string match and needs
     * no join table and no migration.
     *
     * VISIBILITY IS THE SESSION'S FLAG, NOT THE PHOTO'S. Every upload route
     * writes session_images.is_public = 0 and nothing anywhere sets it to 1 -
     * the privacy toggle on the session page updates the SESSION. Adding
     * `AND si.is_public = 1` here returns zero rows for every spot on the
     * planet, and reads as "nobody has posted photos here" rather than as a
     * bug. ImageService.whereVisible makes the same choice for the same reason.
     *
     * The rider comes back with the photo so a tile can credit and link them;
     * the columns are the same four QueryParser allows on a with[]=User, so
     * this exposes nothing that a public session does not already carry.
     */
    async photos({ spotId, limit = 24 })
    {
        const query = `
            SELECT si.id, si.name,
                   s.id AS session_id, s.title AS session_title,
                   s.session_date,
                   u.id AS user_id, u.first_name, u.profile_img
            FROM session_images si
            JOIN sessions s ON s.id = si.session_id
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.location_id = :spotId
              AND s.is_public = 1
              AND si.name IS NOT NULL AND si.name <> ''
            ORDER BY s.session_date DESC, si.id DESC
            LIMIT :limit`;

        return sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { spotId: String(spotId), limit: limit },
        });
    }

    /*
     * Adds a spot somebody surfed. The seed data cannot cover the world - OSM
     * has two named spots in all of New Jersey - so this is how coverage grows
     * outside Europe, and it has to stay open to any signed-in user.
     *
     * Rejects only an obvious re-add: same rough position AND a name that
     * normalizes to the same thing. Picking between genuinely nearby breaks is
     * the caller's job, using /nearest, because only a person knows whether two
     * peaks 100m apart are one spot or two.
     */
    async create(params)
    {
        const lat = Number.parseFloat(params.lat);
        const lon = Number.parseFloat(params.lon);
        const name = String(params.name || '').trim();

        if (!name) throw new Error('name is required');
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('lat must be a valid latitude');
        if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('lon must be a valid longitude');

        // Crow-flight deliberately: a re-add is the same physical break, and a
        // 75m duplicate check must not depend on a road existing between them.
        const near = await this.nearestByCrow({ lat, lon, radius: DUPLICATE_RADIUS_M, limit: 10 });
        const collision = near.find((spot) => sameSpotName(spot.name, name));
        if (collision) {
            const error = new Error(`"${collision.name}" is already recorded ${Math.round(collision.distance_m)}m away`);
            error.code = 'SPOT_EXISTS';
            error.spot = collision;
            throw error;
        }

        return BaseModel.create({
            // The string primary key carries provenance without a join, so a
            // later OSM refresh can leave contributed rows alone.
            id: `user:${crypto.randomUUID()}`,
            source: 'user',
            name: name,
            // VARCHAR columns, so these are stored as text and every read has
            // to cast. Not worth a migration until something needs an index.
            lat: String(lat),
            lon: String(lon),
            created_by: params.created_by || null,
            is_public: true,
            break_type: params.break_type || null,
            wave_direction: params.wave_direction || null,
            bottom: params.bottom || null,
            difficulty: params.difficulty || null,
            hazards: params.hazards || null,
            notes: params.notes || null,
        });
    }
}


module.exports = SurflineSpotService;
