const db = require("../models");
const BaseModel = db.SurflineSpot;
const Op = db.Sequelize.Op;
const BaseService  = require('./BaseService');
const sequelize = require('./sequelize');
const { QueryTypes } = require('sequelize');

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
}

module.exports = SurflineSpotService;
