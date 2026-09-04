const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 60 * 120, checkperiod: 120 } );
const axios = require("axios");
const stormglassConfig = require('./../../config/stormglass');

const getReport = ({lat, lon, name})=>
{
    return new Promise(
        (resolve, reject)=>
        {
            const value = myCache.get( name );
            if ( value == undefined ){
                const params = [
                    'waveHeight',
                    'airTemperature',
                    'pressure',
                    'currentDirection',
                    'currentSpeed',
                    'swellDirection',
                    'swellHeight',
                    'swellPeriod',
                    'secondarySwellPeriod',
                    'secondarySwellDirection',
                    'secondarySwellHeight',
                    'waterTemperature',
                    'waveDirection',
                    'wavePeriod',
                    'windWaveHeight',
                    'windWavePeriod',
                    'windSpeed'
                ];

                axios
                    .request(
                        `${stormglassConfig.endpoint}/v2/weather/point?lat=${lat}&lng=${lon}&params=${params.join(',')}`, {
                            headers: {
                                'Authorization': stormglassConfig.key
                            }}
                    ).then((jsonData) => {
                    myCache.set( name, jsonData.data )
                    resolve(jsonData.data)
                })
                    .catch(e=>{
                        // Stormglass explains a rejection in the response body.
                        // Axios only carries the status line, which cannot tell a
                        // dead key from an expired plan from a blown quota.
                        const detail = e.response && e.response.data;
                        reject(detail
                            ? new Error(`stormglass ${e.response.status}: ${JSON.stringify(detail)}`)
                            : e);
                    })
            }
            else{
                resolve(value)
            }
        }
    )
}

module.exports = getReport;
