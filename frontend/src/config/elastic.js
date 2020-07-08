require('dotenv').config();
module.exports = {
    host : process.env.REACT_APP_ELASTIC_HOST, 
    credentials : process.env.REACT_APP_ELASTIC_CREDS,
    sessions_index : process.env.REACT_APP_ELASTIC_SESSIONS_INDEX,
    user_boards_index : process.env.REACT_APP_ELASTIC_USER_BOARDS_INDEX
}