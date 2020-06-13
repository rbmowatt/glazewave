const SessionService = require('./../services/SessionService');
const UserBoardService = require('./../services/UserBoardService');
const {getAlgoliaClient} = require('./../services/algolia/client')

SessionService.make().all({}).then(data=>{
    data.forEach(session=>
        {
            session.dataValues.objectID = 'session_' + session.id;
            console.log(session.dataValues);
            getAlgoliaClient('sessions').saveObjects([session.dataValues], {
                autoGenerateObjectIDIfNotExist: true
              }).then(({ objectIDs }) => {
                console.log(objectIDs);
              });
        })
}).catch(e=>console.log('error', e));



UserBoardService.make().all({}).then(data=>{
    data.forEach(session=>
        {
            session.dataValues.objectID = 'ub_' + session.id;
            console.log(session.dataValues);
            getAlgoliaClient('user_boards').saveObjects([session.dataValues], {
                autoGenerateObjectIDIfNotExist: true
              }).then(({ objectIDs }) => {
                console.log(objectIDs);
              });
        })
}).catch(e=>console.log('error', e))