var WWO = require('worldweatheronline-api');

var client = WWO.createClient({
    key: process.env.wwo_key,
    responseType: 'json',
    subscription: 'premium',
    locale: 'EN'
});