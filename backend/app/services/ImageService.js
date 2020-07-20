const db = require("../models");
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');
const deletes3Image  = require('./../services/images/destroy');

class ImageService  extends BaseService {
    constructor(model){
        super(db[model]);
    }

  async delete( id )
  {   
    return  new Promise((resolve, reject)=>
    {
        let image = {};
        this.BaseModel.findByPk(id).
        then(data=>{
            image = data;
            this.BaseModel.destroy({
                where: { id: id }
            })
            .then(()=>{
                deletes3Image(image.name)
                .then(d=>
                {
                    resolve(1);
                })
                .catch(e=>reject(e))
            })
        })
    })
  }

  async getAll(params)
{
    if(params.wheres.is_public){
        return db.sequelize.query(
            `SELECT user_board_images.id, user_board_images.name FROM surfbook.user_board_images 
            JOIN user_boards ON user_board_images.user_board_id = user_boards.id  where user_boards.user_id = $1 OR user_boards.is_public = 1
            UNION ALL
            SELECT session_images.id, session_images.name  FROM surfbook.session_images 
            JOIN sessions ON sessions.id = session_images.session_id  where sessions.user_id = $1 OR sessions.is_public = 1;`,
            {
              bind: [params.wheres.user_id],
            }
          );
    }
    return db.sequelize.query(
        `SELECT user_board_images.id, user_board_images.name FROM surfbook.user_board_images 
        JOIN user_boards ON user_board_images.user_board_id = user_boards.id  where user_boards.user_id = $1
        UNION ALL
        SELECT session_images.id, session_images.name  FROM surfbook.session_images 
        JOIN sessions ON sessions.id = session_images.session_id  where sessions.user_id = $1;`,
        {
          bind: [params.wheres.user_id],
        }
      );
}
}



module.exports = ImageService;