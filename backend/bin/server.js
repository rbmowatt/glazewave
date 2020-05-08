const app = require('../app/index');
require('dotenv').config()

app.listen(process.env.SERVER_PORT, ()=>console.log('listening on port', process.env.SERVER_PORT));process.env.SERVER_PORT