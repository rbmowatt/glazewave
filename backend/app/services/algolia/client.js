require('dotenv').config();
const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_CLIENT_SECRET);
const getAlgoliaClient = ( index ) =>
{
    return client.initIndex(index);
}
module.exports = {getAlgoliaClient}