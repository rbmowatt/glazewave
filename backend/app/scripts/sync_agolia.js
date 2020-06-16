const SessionService = require('../services/SessionService');
const UserBoardService = require('../services/UserBoardService');
const {getSessionQueue, getUserBoardQueue} = require('./../services/queue/BetterQueue')

SessionService.make().all({limit : 1000, with_all_relations : true}).then(data=>{
    data.forEach(session=>
    {
      getSessionQueue().push(session).on('finish', function (result) {
        console.log( ' session created ' , result[0].objectID)
      })
    })
}).catch(e=>console.log('error', e));


UserBoardService.make().all({limit : 1000, with_all_relations : true }).then(data=>{
    data.forEach(board=>
        {
          getUserBoardQueue().push(board).on('finish', function (result) {
            console.log( ' board created ' , result[0].objectID)
          })
        })
}).catch(e=>console.log('error', e))