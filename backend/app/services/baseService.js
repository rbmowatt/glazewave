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

  async where( {wheres, withs , limit = 20, page = 0, order_by} )
  {    
    const options = { where: wheres, include: withs, offset: page, limit: limit };
    if(order_by) options.order = order_by;
    console.log('select options', options);
    return this.BaseModel.findAll(options);
  }

  async find({id, withs, selects = []})
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

  async upsert(params, callback = null)
  {
    return await this.validatePost(params).then(data=>{return this.BaseModel.upsert(params)});
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

  static make( model = null )
  {
    return (model ) ? new this(model) : new this;
  }
}

module.exports = BaseService;