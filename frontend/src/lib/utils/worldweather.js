import WWO from 'worldweatheronline-api';
import  wwConfig  from './../../config/worldweather';

//console.log('ww comf', wwConfig);
export default WWO.createClient({
    //key: wwConfig.key,
    key : 'd83ea85d7b8b4e4aa71161416200506',
    responseType: 'json',
    subscription: 'premium',
    locale: 'EN'
});