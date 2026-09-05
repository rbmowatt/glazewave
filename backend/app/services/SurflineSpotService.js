const db = require("../models");
const BaseModel = db.SurflineSpot;
const Op = db.Sequelize.Op;
const BaseService  = require('./BaseService');
const sequelize = require('./sequelize');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const { sameSpotName } = require('./../lib/spot_name');

// How close a new spot has to be to an existing one, with a similar name,
// before it is treated as the same break rather than a new one. Deliberately
// tight: adjacent peaks on one beach are genuinely different spots and
// merging them loses the distinction a surf log exists to record.
const DUPLICATE_RADIUS_M = 75;

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
    nearest({ lat, lon, radius, limit })
    {
        const query = `
            SELECT id, name, url,
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

        const near = await this.nearest({ lat, lon, radius: DUPLICATE_RADIUS_M, limit: 10 });
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
