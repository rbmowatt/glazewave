const SessionService = require('../services/SessionService');
const UserBoardService = require('../services/UserBoardService');
const SurflineSpotService = require('../services/SurflineSpotService');
const {getSessionQueue, getUserBoardQueue, getSurflineSpotsQueue} = require('./../services/queue/BetterQueue')

let queue = getSessionQueue();
SessionService.make().all({limit : 1000, with_all_relations : true}).then(data=>{
    data.forEach(session=>
    {
      queue.push(session).on('finish', function (result) {
        console.log( ' session created ' , result[0].objectID)
      })
    })
}).catch(e=>console.log('error', e));

let queue2 = getUserBoardQueue();
UserBoardService.make().all({limit : 1000, with_all_relations : true }).then(data=>{
    data.forEach(board=>
        {
          queue2.push(board).on('finish', function (result) {
            console.log( ' board created ' , result[0].objectID)
          })
        })
}).catch(e=>console.log('error', e))
/*
let queue = getSurflineSpotsQueue();
SurflineSpotService.make().all({limit : 10000, with_all_relations : false}).then(data=>{
  data.forEach(spot=>
      {
        queue.push(spot).on('finish', function (result) {
          console.log( ' surfline spot  created ' , result[0].objectID)
        })
      })
}).catch(e=>console.log('error', e))
*/