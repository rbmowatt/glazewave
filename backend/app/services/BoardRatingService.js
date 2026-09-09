const db = require("../models");
const BaseService = require('./BaseService');
const { MIN_RIDERS } = require('./rating/BoardRating');

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
            };
        });
    }

    async publicFor(boardId)
    {
        const rows = await this.publicForMany([boardId]);
        return rows.length ? rows[0] : { board_id: Number(boardId), riders: 0, rating: null, min_riders: MIN_RIDERS };
    }
}

module.exports = BoardRatingService;
