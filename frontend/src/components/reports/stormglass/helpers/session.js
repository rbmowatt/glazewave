
import getSpots from './../../../../lib/utils/surfline_alg_geo';
import apiConfig from './../../../../config/api';

export const getSessionData = (lat, lng) => {
    return new Promise(( resolve, reject )=>{
            const  currentTime = new Date();
            getSpots(lat, lng).then(data=>{
                const lat = data.hits[0]._geoloc.lat;
                const lon = data.hits[0]._geoloc.lon;
            fetch(`${apiConfig.host + apiConfig.port }/api/sc?lat=${data.hits[0]._geoloc.lat}&lon=${data.hits[0]._geoloc.lon}&name=${data.hits[0].id}`).then((response) => response.json()).then((jsonData) => {
               const data = jsonData.hours[currentTime.getHours()];
                const obj = {
                    water_temperature : ((data.waterTemperature.sg * 9/5) + 32).toFixed(),
                    swell_height :  (data.swellHeight.noaa * 3.28084).toFixed(1),
                    swell_period : data.swellPeriod.noaa.toFixed(),
                    wave_height : (data.waveHeight.noaa * 3.28084).toFixed(1),
                    wave_period : data.wavePeriod.noaa.toFixed() ,
                    pressure : (data.pressure.sg * 0.0002953).toFixed(2) * 100 ,
                    wind_speed : (data.windSpeed.sg * 1.94384 ).toFixed(1),
                    lat : lat,
                    lon : lon
                };
                resolve(obj)
            });
        })
})}