/*
The Query Parser will look at the query being passed in and break it down into a number of categories that make it easy for 
services implementing BaseService.js to use
*/
const db = require("./../models");

const QueryParser = function (req, res, next) {
    //these keys are resrved and should not be expected to pass through or be assigned inconsistent values
    const reservedKeys = ['with', 'page', 'limit', 'order_by', 'in', 'page'];
    //console.log('pq::incoming query params', req.query);
    let parser = {
      id : req.query.id || null,
      query : req.query,
      withs : parseWiths(req.query.with) || [],
      limit : parseInt(req.query.limit) || 20,
      order_by: parseOrder(req.query.order_by) || [],
      where_in : parseWhereIn(req.query.in) || [],
    };
    parser.page = (parseInt(req.query.page) || 0) * parser.limit;
    //clean the query up, no need to replicate what we've already sorted
    reservedKeys.forEach(key=>{
      delete req.query[key];
    })
    parser.wheres = req.query;
    req.parser = parser;
    next()
  }
  /*
  Turn string in format prop_DIRECTION to proper format in case of extra _
  */
  const parseOrder = ( order ) =>
  {
    if(!order) return;
    
    const data = order.split('_');
    const a = [];
    let ascDesc = data.pop();
    a.push([data.join('_'), ascDesc]);
    return a;
  }
/*
Where in takes a comma seperated list of ids
split them into array 
*/
  const parseWhereIn = ( whereIn ) =>
  {
    if(!whereIn) return[];
    return whereIn.split(',');
  }
/*
Withs allow you to ask for associated relations
Recursive so as to allow nesting
*/
  const parseWiths = (withs)=>
  {
      if(!withs) return;
      const result = [];
      if(!Array.isArray(withs))
      {
        if(withs.split('.').length === 1)
        {
          //it's a single with with no children, just return
            result.push({model : db[withs]});
            return result;
        }
        //turn it into an array to satisfy the forEach below
        withs = [withs];
      }
      withs.forEach( w =>{
        if(w.split('.').length > 1)
        {
            //it has a child so we're going to have to handle this one then recurse
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
