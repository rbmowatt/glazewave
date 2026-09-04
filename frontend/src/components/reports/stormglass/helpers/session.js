
import getSpots from './../../../../lib/utils/spots';
import apiConfig from './../../../../config/api';

export const getSessionData = (lat, lng) => {
    return new Promise(( resolve, reject )=>{
            const  currentTime = new Date();
            getSpots(lat, lng).then(spots=>{
                if (!spots.length) return resolve(null);
                const spot = spots[0];
            fetch(`${apiConfig.host + apiConfig.port }/api/sc?lat=${spot.lat}&lon=${spot.lon}&name=${spot.id}`).then((response) => response.ok ? response.json() : null).then((jsonData) => {
                // a failing /api/sc answers with a {message} body, so reading
                // hours[] off it throws rather than degrading
                if (!jsonData || !jsonData.hours) return resolve(null);
               const data = jsonData.hours[currentTime.getHours()];
                const obj = {
                    water_temperature : ((data.waterTemperature.sg * 9/5) + 32).toFixed(),
                    swell_height :  (data.swellHeight.noaa * 3.28084).toFixed(1),
                    swell_period : data.swellPeriod.noaa.toFixed(),
                    wave_height : (data.waveHeight.noaa * 3.28084).toFixed(1),
                    wave_period : data.wavePeriod.noaa.toFixed() ,
                    pressure : (data.pressure.sg * 0.0002953).toFixed(2) * 100 ,
                    wind_speed : (data.windSpeed.sg * 1.94384 ).toFixed(1),
                    lat : spot.lat,
                    lon : spot.lon
                };
                resolve(obj)
            });
        }).catch(reject)
})}