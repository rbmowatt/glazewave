import React from 'react';

const Conditions = props =>{
    const {session} = props;
    return (
        <div className="card conditions">
            <strong>Conditions</strong>
            <div className="row" >
              <div className="col-6">   
              <div>Water Temp: { session.SessionDatum.water_temperature}F</div>  
              <div>Swell Height: {session.SessionDatum.swell_height}ft</div>  
              <div>Swell Period: {session.SessionDatum.swell_period }s</div>  
              <div>Wave Height: {session.SessionDatum.wave_height }ft</div>  
              </div>
              <div className="col-6">   
              <div>Wave Period: {session.SessionDatum.wave_period }s</div>  
              <div>Pressure: {session.SessionDatum.pressure }in</div>  
              <div>Wind Speed: {session.SessionDatum.wind_speed }k</div>  
            </div>
          </div>
    </div>
    )
}
export default Conditions;