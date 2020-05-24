const db = require("./../models");

const QueryParser = function (req, res, next) {
    const reservedKeys = ['with', 'page', 'limit'];
    console.log(req.query);
    let parser = {
      with : parseWiths(req.query.with) || [],
      limit : parseInt(req.query.limit) || 20,
    };
    delete req.query.limit;
    delete req.query.with;
    console.log(req.query);
    parser.page = (parseInt(req.query.page) || 0) * parser.limit
    req.parser = parser;
    next()
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
            console.log('nested', w);
        }
        else{
            let table = db[w];
            console.log("table", table.tableName);
            result.push({model : table });
        }
      })
      console.log('result', JSON.stringify(result) );
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