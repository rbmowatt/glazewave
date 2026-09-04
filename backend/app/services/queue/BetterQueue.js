var Queue = require('better-queue');
const db = require('./../../services/sequelize');
const elasticConfig = require('./../../config/elastic');
const { QueryTypes } = require('sequelize');
require('dotenv').config();


'use strict'
const { Client } = require('@elastic/elasticsearch')


const getClient = () =>
{
    const client = new Client({ node: elasticConfig.host })
client.on('response', (err, result) => {
    if (err) {
      console.log(err)
    } else {
        console.log(result)
    }
  })
  return client;
}

const setSessionQueue = (sessions, cb)=>
{
    let data = [];
    sessions.forEach((session)=>
    {
       data.push(session.id);
    })
    let query = `SELECT sessions.id, sessions.user_id, title, sessions.rating, user_boards.name as board, sessions.is_public, locations.name as location,
    session_data.water_temperature, session_data.swell_height, session_data.swell_period, session_data.wave_height, session_data.wave_period, session_data.pressure,
    session_data.wind_speed FROM surfbook.sessions
    LEFT JOIN session_data ON sessions.id = session_data.session_id 
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN locations on locations.id = sessions.location_id where sessions.id IN (:ids)`;
    db.query(query, { type: QueryTypes.SELECT, replacements: { ids: data } })
    .then(data=>{
        data.forEach(d=>{
            getClient().update({
                index: process.env.ELASTIC_SESSIONS_INDEX,
                id : d.id,
                body: {
                    doc: d,
                    doc_as_upsert: true
                  }
                 })
                .catch(e=>{})        
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
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id where user_boards.id IN (:ids)`;
    db.query(query, { type: QueryTypes.SELECT, replacements: { ids: data } })
    .then(data=>{
        data.forEach(d=>{
            getClient().update({
                index: process.env.ELASTIC_USER_BOARDS_INDEX,
                id : d.id,
                body: {
                    doc: d,
                    doc_as_upsert: true
                  }
                 })
                .catch(e=>{})        
                cb(null, data);
            }
        );
    });
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
    getSessionQueue,
    getUserBoardQueue,
    getClient
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