const db = require("../models");
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');
const deletes3Image  = require('./../services/images/destroy');

/*
 * An image is as visible as the row it hangs off. session_images.is_public and
 * user_board_images.is_public are both written 0 by every upload route and
 * nothing ever sets them, so reading the image's own flag would hide a public
 * session's photos from the person it was shared with.
 */
const PARENT = {
  SessionImage: { model: () => db.Session, alias: 'Session' },
  UserBoardImage: { model: () => db.UserBoard, alias: 'UserBoard' },
};

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

  /**
   * where(), narrowed to images whose parent the caller may read. The parent
   * join is required, so an orphaned image row is invisible rather than public.
   */
  async whereVisible(parser, viewer)
  {
    const parent = PARENT[this.BaseModel.name];
    if (!parent) throw new Error(`no visibility rule for ${this.BaseModel.name}`);

    const clauses = [{ [`$${parent.alias}.is_public$`]: 1 }];
    if (viewer) clauses.push({ user_id: viewer.id });

    return this.BaseModel.findAll({
      where: { [Op.and]: [parser.wheres || {}, { [Op.or]: clauses }] },
      include: [{ model: parent.model(), attributes: [], required: true }],
      limit: parser.limit || 20,
      offset: parser.page || 0,
    });
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