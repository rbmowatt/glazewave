import WWO from 'worldweatheronline-api';
import  wwConfig  from './../../config/worldweather';

export default WWO.createClient({
    key : wwConfig.key,
    responseType: 'json',
    subscription: 'premium',
    locale: 'EN'
});