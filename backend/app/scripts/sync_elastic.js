'use strict'
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://192.168.99.101:9200' })
const SessionService = require('../services/SessionService');


SessionService.make().all({limit : 1000, with_all_relations : true}).then(data=>{
    data.forEach(session=>
    {
        await client.index({
            index: 'sessions',
            body: {
              character: 'Ned Stark',
              quote: 'Winter is coming.'
            }
          })
    })
}).catch(e=>console.log('error', e));