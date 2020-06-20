const db = require("../models");
const BaseModel = db.UserBoard;
const ManufacturerService = require('./ManufacturerService');
const BoardService = require('./BoardService');

const BaseService = require('./BaseService');

class UserBoardService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    async create(params, callback = null)
    {
        if(!Number.isInteger(parseInt(params.manufacturer_id)))
        {
            return new Promise( (resolve, reject)=>{ ManufacturerService.make().create({name : params.manufacturer_id})
            .then(data=>{
                params.manufacturer_id  = data.id;
                BoardService.make().create({model : params.board_id, manufacturer_id : data.id})
                .then(data=>{
                    params.board_id  = data.id;
                    resolve(super.create(params, callback));
                })
            })})
        } 
        else if(!Number.isInteger(parseInt(params.board_id)))
        {
            return new Promise( 
                (resolve, reject)=>{ 
                     BoardService.make().create({model : params.board_id, manufacturer_id : params.manufacturer_id})
                    .then(data=>{
                        params.board_id  = data.id;
                        resolve(super.create(params, callback));
                        }
                    )
                }
            )
        } else 
        {
            return super.create(params, callback);
        }
    }
  
}

module.exports = UserBoardService;