var Queue = require('better-queue');
const {getAlgoliaClient} = require('./../algolia/client');
const db = require('./../../services/sequelize')
const { QueryTypes } = require('sequelize');
const ALGOLIA_SESSION_INDEX = 'sessions';
const ALGOLIA_SESSION_PREFIX = 'session_';
const ALGOLIA_USER_BOARD_INDEX = 'user_boards';
const ALGOLIA_USER_BOARD_PREFIX = 'user_board_';




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
    let query = `SELECT sessions.id,  concat('session_', sessions.id) as objectID, sessions.user_id, title, sessions.rating, sessions.is_public , user_boards.name as board, locations.name as location FROM surfbook.sessions
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN locations on locations.id = sessions.location_id where sessions.id IN (` + data.join(',') + `)`;
    console.log('update query', query)
    db.query(query, { type: QueryTypes.SELECT })
    .then(data=>{
        getAlgoliaClient(ALGOLIA_SESSION_INDEX).saveObjects(data, {
        }).then(({ objectIDs }) => {
            result = objectIDs;
        }).catch(e=>console.log(e));
        cb(null, data);
    });
}

const setUserBoardQueue = (boards, cb)=>
{
    let data = [];
    boards.forEach((board)=>
    {
        data.push(board.id);
    })
    let query=`SELECT user_boards.user_id, concat('user_board_', user_boards.id) as objectID, user_boards.id, user_boards.name, user_boards.rating, 
    user_boards.size, user_boards.is_public, user_boards.notes,  boards.model, manufacturers.name as manufacturer  from user_boards
    LEFT JOIN boards on boards.id = user_boards.board_id
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id where user_boards.id IN (` + data.join(',') + `)`;
    db.query(query, { type: QueryTypes.SELECT })
    .then(data=>{
        getAlgoliaClient(ALGOLIA_USER_BOARD_INDEX).saveObjects(data, {
        }).then(({ objectIDs }) => {
            result = objectIDs;
        }).catch(e=>console.log(e));
        cb(null, data);
    });
}

var getSessionQueue = () => {
    return new Queue(setSessionQueue, 
        {batchSize: 10,
        batchDelay: 5000,
        batchDelayTimeout: 1000})
    }

 var getUserBoardQueue = () => {
    return new Queue(setUserBoardQueue, 
        {batchSize: 10,
        batchDelay: 5000,
        batchDelayTimeout: 1000})
    }   

module.exports = {
    ALGOLIA_SESSION_INDEX,
    ALGOLIA_SESSION_PREFIX,
    ALGOLIA_USER_BOARD_INDEX,
    ALGOLIA_USER_BOARD_PREFIX,
    getSessionQueue,
    getUserBoardQueue,
    getClient
};

