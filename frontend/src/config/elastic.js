const apiConfig = require('./api');

module.exports = {
    // ReactiveSearch talks to the API's scoped proxy, never to Elasticsearch.
    // ES is bound to 127.0.0.1 on the box, and the filters these components
    // build are constructed in the browser, so the ownership check has to
    // happen server side or it is only a suggestion.
    host : `${apiConfig.host}${apiConfig.port || ''}/api/es`,
    // Logical keys. The proxy maps these to the real ELASTIC_*_INDEX values,
    // so a rename on the box cannot strand a build that inlined the old name.
    sessions_index : 'sessions',
    user_boards_index : 'user_boards'
}
