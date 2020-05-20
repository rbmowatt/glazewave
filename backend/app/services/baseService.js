const db = require("../models");
let BaseModel = '';
const Op = db.Sequelize.Op;

class BaseService {

  constructor(BaseModel)
  {
    super.constructor();
    console.log(this.BaseModel)
    this.BaseModel = BaseModel;
  }

  async where( wheres, withs , sorts , selects , limit = 20, page = 0)
  {    
    return this.BaseModel.findAll({ where: wheres, include: withs, offset: page, limit: limit });
  }

  async find(id, withs, selects = [])
  {
    const options = {include: withs};
    if(selects.length) options.attributes = selects;
    return this.BaseModel.findByPk( id, options);
  }

  async create(params, callback = null)
  {
    return await this.validatePost(params).then(data=>{return this.BaseModel.create(data)});
  }

  async update(id, params, callback = null)
  {
    return await this.validatePost(params).then(data=>{return this.BaseModel.update(params, {
      where: { id: id }
    })});
  }

  async delete( id )
  {    
    return this.BaseModel.destroy({
      where: { id: id }
    })
  }

  /** This will make sure that any keys that do not exust in the table but do exist in the reqest are stripped out
   */
  async validatePost(params)
  {
    let data = {};
    Object.keys(params).forEach(param =>{
        if(Object.keys(this.BaseModel.rawAttributes).indexOf(param) !== -1)
        {
            data[param] = params[param];
        }
    })
    return data;
  }

  static make()
  {
    return new this;
  }
}

module.exports = BaseService;