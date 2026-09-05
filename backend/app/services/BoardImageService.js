const db = require("../models");
const BaseService = require('./BaseService');
const DisplayScope = require('./rights/DisplayScope');
const s3Config = require('./../config/s3');

const BaseModel = db.BoardImage;

class BoardImageService extends BaseService {

    constructor(){
        super(BaseModel);
    }

    /**
     * The only supported way to get catalog images out of the API.
     *
     * Loads under the `rights` scope on purpose: the default scope hides the
     * URL columns from generic includes, and this method needs them to build a
     * URL. The gate is not skipped, it moves into publicImage, which also
     * attaches the credit the default scope cannot.
     */
    async publicFor(boardId)
    {
        const rows = await BaseModel.scope('rights').findAll({
            where: { board_id: boardId },
            include: [{ model: db.ImageLicense }, { model: db.BoardSource }],
            order: [['is_default', 'DESC'], ['position', 'ASC'], ['id', 'ASC']],
        });

        return rows
            .map((row) => DisplayScope.publicImage(row, s3Config.publicRoot))
            .filter(Boolean);
    }
}

module.exports = BoardImageService;
