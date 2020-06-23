const db = require("./../models");

const QueryParser = function (req, res, next) {
    const reservedKeys = ['with', 'page', 'limit'];
    //console.log('pq::incoming query params', req.query);
    let parser = {
      id : req.query.id || null,
      query : req.query,
      withs : parseWiths(req.query.with) || [],
      limit : parseInt(req.query.limit) || 20,
      order_by: parseOrder(req.query.order_by) || [],
      where_in : parseWhereIn(req.query.in) || []
    };
    delete req.query.limit;
    delete req.query.with;
    delete req.query.order_by; 
    delete req.query.in; 
    parser.page = (parseInt(req.query.page) || 0) * parser.limit;
    delete req.query.page; 
    parser.wheres = req.query;
    req.parser = parser;
    next()
  }

  const parseOrder = ( order ) =>
  {
    if(!order) return;
    
    const data = order.split('_');
    const a = [];
    let ascDesc = data.pop();
    a.push([data.join('_'), ascDesc]);
    return a;
  }

  const parseWhereIn = ( whereIn ) =>
  {
    if(!whereIn) return[];
    return whereIn.split(',');
  }

  const parseWiths = (withs)=>
  {
      if(!withs) return;
      const result = [];
      if(!Array.isArray(withs))
      {
        if(withs.split('.').length === 1)
        {
            result.push({model : db[withs]});
            return result;
        }
       withs = [withs];
      }
      withs.forEach( w =>{
        if(w.split('.').length > 1)
        {
            let table = db[w.split('.')[0]];
            const cr = {model : table}
            const remaining = w.substring(w.indexOf('.')+1)
            cr.include = parseWiths(remaining);
            result.push(cr);
        }
        else{
            let table = db[w];
            result.push({model : table });
        }
      })
      return result;
  }

  module.exports = QueryParser;

  /*

  User.findAll({
    include: [{
      model: Tool,
      as: 'Instruments',
      include: [{
        model: Teacher,
        where: {
          school: "Woodstock Music School"
        },
        required: false
      }]
    }]
  });
  */