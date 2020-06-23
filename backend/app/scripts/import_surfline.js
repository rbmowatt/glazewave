const axios = require("axios");
const StateService = require("./../services/StateService");
const SpotService = require("./../services/SurflineSpotService");


function range(start,stop) {
    var result=[];
    for (var idx=start.charCodeAt(0),end=stop.charCodeAt(0); idx <=end; ++idx){
      result.push(String.fromCharCode(idx));
    }
    return result;
  };
  range('A','Z').forEach(ltr=>
    {
        axios
.request(
    'https://services.surfline.com/kbyg/search/site?q=' + ltr + '&querySize=5000'
)
.then(({ data }) => {
    data.forEach(element => {
        if(element.suggest && element.suggest['spot-suggest'])
        {
           element.hits.hits.forEach( el =>
                {
                    if(el._source.breadCrumbs.indexOf('United States') !== -1){
                        StateService.make().where({wheres:[{name : el._source.breadCrumbs[1]}]})
                        .then(data=>{
                            //console.log('state', data)
                            let parts = el._source.href.split("/");
                            let d = {
                                id : parts[parts.length - 1],
                                name : el._source.name,
                                crumbs : el._source.breadCrumbs.toString(),
                                cams : el._source.cams.toString(),
                                state_id : data.length ? data[0].id : null,
                                county : el._source.breadCrumbs.length > 2 ? el._source.breadCrumbs[2] : null,
                                lat : el._source.location.lat,
                                lon : el._source.location.lon,
                                geo : { type: 'Point', coordinates: [el._source.location.lat,el._source.location.lon]},
                                url :  el._source.href,
                            }
                            console.log(d)
                            SpotService.make().upsert(d)
                            .then( data=>console.log('successfully added spot', data))
                            .catch(e=>console.log('erre', e))
                        })
                        .catch(e=>console.log('erre', e))
                    }
                })
            
        }
        
    });
})
.catch(error => {
    console.log('error', error)


  if (error.response && error.response.status === 403) {

  }
})
    })
  


