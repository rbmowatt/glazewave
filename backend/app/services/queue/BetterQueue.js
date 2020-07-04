var Queue = require('better-queue');
const {getAlgoliaClient} = require('./../algolia/client');
const db = require('./../../services/sequelize')
const { QueryTypes } = require('sequelize');
const ALGOLIA_SESSION_INDEX = 'sessions';
const ALGOLIA_SESSION_PREFIX = 'session_';
const ALGOLIA_USER_BOARD_INDEX = 'user_boards';
const ALGOLIA_USER_BOARD_PREFIX = 'user_board_';
const ALGOLIA_SUFLINE_SPOT_INDEX = 'surfline_spots';
const ALGOLIA_SUFLINE_SPOT_PREFIX = 'sl_spot_';


'use strict'
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://192.168.99.101:9200' })
client.on('response', (err, result) => {
    if (err) {
      console.log(err)
    } else {
        console.log(result)
    }
  })


  
  if (Array.prototype.flatMap === undefined) {
    const concat = (x, y) => x.concat(y)

    const flatMap = (f, xs) => xs.map(f).reduce(concat, [])
    Array.prototype.flatMap = function(f) {
      return flatMap(f, this)
    }
  }


const getClient = (index) =>
{
    return getAlgoliaClient(index);
}

const setSessionQueue = (sessions, cb)=>
{
    let data = [];
    sessions.forEach((session)=>
    {
       data.push(session.id);
    })
    let query = `SELECT sessions.id, sessions.user_id, title, sessions.rating, user_boards.name as board, sessions.is_public, locations.name as location FROM surfbook.sessions
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN locations on locations.id = sessions.location_id where sessions.id IN (` + data.join(',') + `)`;
    console.log('update query', query)
    db.query(query, { type: QueryTypes.SELECT })
    .then(data=>{
        data.forEach(d=>{
            client.update({
                index: 'sessions',
                type: 'session',
                id : d.id,
                body: {
                    doc: d,
                    doc_as_upsert: true
                  }
                 })
                .then(data=>console.log('elastic ok', data))
                .catch(e=>console.log(e.meta.body.error))        
                cb(null, data);
            }
        );
    })
}

const setUserBoardQueue = (boards, cb)=>
{
    let data = [];
    boards.forEach((board)=>
    {
        data.push(board.id);
    })
    let query=`SELECT user_boards.user_id,  user_boards.id, user_boards.name, user_boards.rating, 
   user_boards.is_public, user_boards.notes,  boards.model, manufacturers.name as manufacturer  from user_boards
    LEFT JOIN boards on boards.id = user_boards.board_id
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id where user_boards.id IN (` + data.join(',') + `)`;
    db.query(query, { type: QueryTypes.SELECT })
    .then(data=>{
        data.forEach(d=>{
            client.update({
                index: 'user_boards',
                type: 'user_board',
                id : d.id,
                body: {
                    doc: d,
                    doc_as_upsert: true
                  }
                 })
                .then(data=>console.log('elastic ok', data))
                .catch(e=>console.log(e.meta.body.error))        
                cb(null, data);
            }
        );
    });
}


const setSurflineSpotsQueue = (spots, cb)=>
{
    let data = [];
    spots.forEach((spot)=>
    {
        console.log('adding spot', spot.id)
        spotData = spot.dataValues;
        spotData.objectID = ALGOLIA_SUFLINE_SPOT_PREFIX + spot.id;
        spotData._geoloc  = {
            lat : parseFloat(spot.lat),
            lon : parseFloat(spot.lon),
        }
        delete spotData.geo;
        delete spotData.lat;
        delete spotData.lon;
        delete spotData.createdAt;
        delete spotData.updatedAt;
        delete spotData.crumbs;
        console.log(spotData)
        data.push(spotData);
    });
   
    getAlgoliaClient(ALGOLIA_SUFLINE_SPOT_INDEX).saveObjects(data, {
        }).then(({ objectIDs }) => {
            result = objectIDs;
            console.log('added record', objectIDs)
        }).catch(e=>console.log(e));
        cb(null, data);
}


var getSurflineSpotsQueue= () => {
    return new Queue(setSurflineSpotsQueue, 
        {batchSize: 10})
    }

var getSessionQueue = () => {
    return new Queue(setSessionQueue, 
        {batchSize: 15,
        batchDelay: 5000,
        batchDelayTimeout: 1000})
    }

 var getUserBoardQueue = () => {
    return new Queue(setUserBoardQueue, 
        {batchSize: 10,
        batchDelay: 50000,
        batchDelayTimeout: 1000})
    }   

module.exports = {
    ALGOLIA_SESSION_INDEX,
    ALGOLIA_SESSION_PREFIX,
    ALGOLIA_USER_BOARD_INDEX,
    ALGOLIA_USER_BOARD_PREFIX,
    getSessionQueue,
    getUserBoardQueue,
    getClient,
    getSurflineSpotsQueue
};




/*

const setSessionQueue = (sessions, cb)=>
{
    let data = [];
    sessions.forEach((session)=>
    {
       data.push(session.id);
    })
    let query = `SELECT sessions.id, sessions.user_id, title, sessions.rating, user_boards.name as board, locations.name as location FROM surfbook.sessions
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN locations on locations.id = sessions.location_id where sessions.id IN (` + data.join(',') + `)`;
    console.log('update query', query)
    db.query(query, { type: QueryTypes.SELECT })
    .then(data=>{
        data.forEach(d=>
           // {
            console.log('datatype', typeof data, data);
            const body = data.flatMap(doc => [{ index: { _index: 'sessions' } }, doc])

                client.bulk({
                    index: 'sessions',
                    body: body,
                    type: 'session'
                  })
                  .then(data=>console.log('elastic ok', data))
                  .catch(e=>console.log(e.meta.body.error))
        
                  cb(null, data);
          //  })
       

    });
}
*/