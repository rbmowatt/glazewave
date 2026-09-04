
import getSpots from './../../../../lib/utils/spots';
import apiConfig from './../../../../config/api';

export const getSessionData = (lat, lng) => {
    return new Promise(( resolve, reject )=>{
        getSpots(lat, lng).then(spots=>{
            if (!spots.length) return resolve(null);
            const spot = spots[0];
            fetch(`${apiConfig.host + apiConfig.port }/api/sc?lat=${spot.lat}&lon=${spot.lon}&name=${spot.id}`)
                .then((response) => response.ok ? response.json() : null)
                .then((conditions) => {
                    // the session POST only writes a session_data row when
                    // wave_height is present, so a partial payload must not
                    // reach the form looking like a real reading
                    if (!conditions || !conditions.wave_height) return resolve(null);
                    resolve(Object.assign({}, conditions, { lat: spot.lat, lon: spot.lon }));
                })
                .catch(reject);
        }).catch(reject)
})}
