const db = require("../models");
const Op = db.Sequelize.Op;

// Cache model descriptions so we only hit the DB once per model
const describeCache = new Map();

class BaseService {

  constructor(BaseModel)
  {
    this.BaseModel = BaseModel;
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
    // Cache the describe() result per model — one DB round-trip per model, not per query
    if (!describeCache.has(this.BaseModel.name)) {
      const atts = await this.BaseModel.describe();
      describeCache.set(this.BaseModel.name, atts);
    }
    const options = { where: wheres, include: withs, offset: page, limit: limit };
    if(where_in.length)  wheres.id = {[Op.in] :  where_in};
    if(order_by) options.order = order_by;
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
                    data.save().then(res=>resolve(data))
                  }
              )
              .catch(e=>reject(e))
        }
    )
  }

  async upsert(params, callback = null)
  {
    return await this.validatePost(params).then(data=>{return this.BaseModel.upsert(data)});
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

  /** Strips out any keys that don't exist in the model's raw attributes */
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
