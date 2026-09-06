const db = require("../models");
const BaseModel = db.UserBoard;
const ManufacturerService = require('./ManufacturerService');
const BoardService = require('./BoardService');

const BaseService = require('./BaseService');

class UserBoardService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    /**
     * The typeahead posts either a numeric id (an existing row the user picked)
     * or the raw text they typed (a row that does not exist yet), for both
     * shaper and model. Anything typed gets created before the user_board.
     */
    async create(params, callback = null)
    {
        let manufacturerName = null;
        let boardModel = null;

        if(!Number.isInteger(parseInt(params.manufacturer_id)))
        {
            manufacturerName = params.manufacturer_id;
            const manufacturer = await ManufacturerService.make().create({name : manufacturerName});
            params.manufacturer_id = manufacturer.id;
        }

        if(!Number.isInteger(parseInt(params.board_id)))
        {
            boardModel = params.board_id;
            const board = await BoardService.make().create({model : boardModel, manufacturer_id : params.manufacturer_id});
            params.board_id = board.id;
        }

        params.name = await this.resolveName(params, manufacturerName, boardModel);

        return super.create(params, callback);
    }

    /**
     * Nickname is optional on the form. Board cards and the session board picker
     * both render this column with no fallback of their own, so an empty name
     * leaves a blank row rather than an unnamed one.
     */
    async resolveName(params, manufacturerName, boardModel)
    {
        const provided = (params.name || '').trim();
        if(provided) return provided;

        if(!manufacturerName || !boardModel)
        {
            const board = await BoardService.make().find({id : params.board_id, withs : [{model : db.Manufacturer}]});
            if(board)
            {
                boardModel = boardModel || board.model;
                manufacturerName = manufacturerName || (board.Manufacturer && board.Manufacturer.name);
            }
        }

        return [manufacturerName, boardModel].filter(Boolean).join(' ').trim() || null;
    }

}

module.exports = UserBoardService;
