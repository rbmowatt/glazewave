const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 60 * 120, checkperiod: 120 } );
const axios = require("axios");

const getReport = ({lat, lon, name})=>
{
    return new Promise(
        (resolve, reject)=>
        {
            value = myCache.get( name );
            if ( value == undefined ){
                const params = 'waveHeight,airTemperature,pressure,currentDirection,currentSpeed,swellDirection,swellHeight,swellPeriod,secondarySwellPeriod,secondarySwellDirection,secondarySwellHeight,waterTemperature,waveDirection,wavePeriod,windWaveHeight,windWavePeriod';

                axios
                .request(
                    `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=${params}`, {
                headers: {
                    'Authorization': 'a27a4ffe-b647-11ea-9fc5-0242ac130002-a27a510c-b647-11ea-9fc5-0242ac130002'
                }}
                ).then((jsonData) => {
                    myCache.set( name, jsonData.data )
                    console.log(jsonData.data);
                    resolve(jsonData.data)
                })
                .catch(e=>reject(e))
            }
            else{
                console.log('getting from cache')
                resolve(value)
            }
        }
    )
}

module.exports = getReport;