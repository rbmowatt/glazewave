const db = require("../models");
let BaseModel = '';
const Op = db.Sequelize.Op;
let algolaiIndex = null;

class BaseService {

  constructor(BaseModel, algolaiIndex = null)
  {
    super.constructor();
    this.BaseModel = BaseModel;
    this.algolaiIndex = algolaiIndex;
  }

  async all( {limit = 20, page = 0, with_all_relations = false, order_by} )
  {    
    const options = {offset: page, limit: limit };
    if(order_by) options.order = order_by;
    if(with_all_relations) options.include = {all:true};
    return this.BaseModel.findAll(options);
  }

  async where( {wheres, withs , limit = 20, page = 0, order_by, where_in = []} )
  {    
    return this.BaseModel.describe().then((atts)=>{
      const options = { where: wheres, include: withs, offset: page, limit: limit };
      if(where_in.length)  wheres.id = {[Op.in] :  where_in};
      if(order_by) options.order = order_by;
      return this.BaseModel.findAll(options);
    })
  }

  async find({id, withs, selects = []})
  {
    const options = {include: withs};
    if(selects.length) options.attributes = selects;
    return this.BaseModel.findByPk( id, options);
  }

  async create(params, callback = null)
  {
    return await this.validatePost(params).then(data=>{
      return this.BaseModel.create(data)}
      );
  }

  async update(id, params, callback = null)
  {    
    return new Promise((resolve, reject)=>
    {
      this.find({id: id})
      .then(data=>
        { 
          for (let [key, value] of Object.entries(params)) {
            data[key] = value;
          }
          data.save().then(res=>resolve(1))
        }
    )
    .catch(e=>reject(e))
    }
  )
  }

  async upsert(params, callback = null)
  {
    return await this.validatePost(params).then(data=>{return this.BaseModel.upsert(params)});
  }

  async delete( id )
  {    
    return new Promise((resolve, reject)=>
      {
        this.find({id: id})
        .then(data=>
          { 
          data.destroy()
            .then(result=>resolve(1))
          }
      )
      .catch(e=>reject(e))
      }
    )
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
