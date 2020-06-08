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
                    console.log('deleted s3 image ', data.name);
                    resolve(1);
                })
                .catch(e=>reject(e))
            })
        })
    })
  }
}

module.exports = ImageService;