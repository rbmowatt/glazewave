const db = require("../models");
const { QueryTypes } = require('sequelize');
const BaseService = require('./BaseService');
const { MIN_RIDERS } = require('./rating/BoardRating');

const DEFAULT_TOP_LIMIT = 25;
const MAX_TOP_LIMIT = 100;

const BaseModel = db.BoardRating;

class BoardRatingService extends BaseService {

    constructor(){
        super(BaseModel);
    }

    /**
     * The only supported way to read a community score.
     *
     * Below MIN_RIDERS the rating is withheld and the rider count is not:
     * "2 riders, no score yet" tells the page what to render without
     * republishing what those riders rated their own boards. Returning the
     * average and letting the client decide would put it on the wire.
     */
    async publicForMany(boardIds)
    {
        const ids = [...new Set([].concat(boardIds).filter(Boolean))];
        if (!ids.length) return [];

        const rows = await BaseModel.findAll({ where: { board_id: ids } });

        return rows.map((row) => {
            const riders = Number(row.rating_count) || 0;
            return {
                board_id: row.board_id,
                riders: riders,
                rating: riders >= MIN_RIDERS ? Number(row.rating_avg) : null,
                min_riders: MIN_RIDERS,
                // The disclosure travels with the number rather than living in
                // a template, so a second caller cannot render the score
                // without it and nobody has to remember to remove it later.
                seeded: (Number(row.seeded_riders) || 0) > 0,
            };
        });
    }

    /**
     * The leaderboard: models with enough riders to have a score, best first.
     *
     * ix_board_rating_rank cannot serve both halves of this - a range on
     * rating_count means the index no longer delivers ranking_score in order,
     * so MySQL filesorts. Fine against a catalog of hundreds; revisit if the
     * board_ratings row count ever reaches the tens of thousands.
     */
    async topRated({limit = DEFAULT_TOP_LIMIT} = {})
    {
        // Interpolated, not bound: sequelize quotes a replacement as a string
        // and MySQL rejects a quoted LIMIT. Clamped to an integer first, which
        // is what makes that safe.
        const cap = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_TOP_LIMIT, 1), MAX_TOP_LIMIT);

        const rows = await db.sequelize.query(`
            SELECT board_ratings.board_id,
                   board_ratings.rating_avg,
                   board_ratings.rating_count,
                   board_ratings.seeded_riders,
                   boards.model,
                   boards.category,
                   manufacturers.name AS manufacturer
              FROM board_ratings
              JOIN boards ON boards.id = board_ratings.board_id
              LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id
             WHERE board_ratings.rating_count >= :minRiders
             ORDER BY board_ratings.ranking_score DESC, board_ratings.rating_count DESC
             LIMIT ${cap}`,
            {type: QueryTypes.SELECT, replacements: {minRiders: MIN_RIDERS}}
        );

        return rows.map((row) => ({
            board_id: row.board_id,
            model: row.model,
            manufacturer: row.manufacturer,
            category: row.category,
            riders: Number(row.rating_count) || 0,
            rating: Number(row.rating_avg),
            min_riders: MIN_RIDERS,
            seeded: (Number(row.seeded_riders) || 0) > 0,
        }));
    }

    async publicFor(boardId)
    {
        const rows = await this.publicForMany([boardId]);
        return rows.length
            ? rows[0]
            : { board_id: Number(boardId), riders: 0, rating: null, min_riders: MIN_RIDERS, seeded: false };
    }
}

module.exports = BoardRatingService;
