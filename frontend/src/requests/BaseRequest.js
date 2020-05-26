import axios from 'axios';
import apiConfig from './../config/api';
const querystring = require('querystring');

class BaseRequest {

    constructor( session ){
        this.session = session;
    }

    get = (wheres = {} , withs = []) => {
        return axios.get( this.getEndpoint() + `?` + this.getWhereString(wheres) + `&` + this.getWithString(withs), this.session.headers);
    }

    getOne = (entityId, withs = []) => {
        return axios.get( this.getEndpoint() + `/` + entityId + `?` + this.getWithString(withs), this.session.headers);
    }

    create = (data, hdrs = {}) => {
        const headers = {...this.session.headers, ...hdrs};
        return axios.post(this.getEndpoint() , data , headers)
    }

    delete  = (entityId) =>
    {
        return axios.delete(this.getEndpoint() + `/` + entityId , this.session.headers);
    }

    update = ( entityId, data) => {
        return axios.put(this.getEndpoint() + `/` + entityId , data,  this.session.headers);
    }

    getHost = () =>{
        return apiConfig.host + apiConfig.port;
    }

    getEndpoint = () => {
        return this.getHost() + this.endpoint;
    }

    getWithString = ( withs ) => {
        let withString = '';
        withs.forEach(element => {
            withString += `with[]=${element}&`;
        });
        return withString.slice(0, withString.length - 1);
    }

    getWhereString = ( wheres ) =>
    {
        return querystring.stringify(wheres);
    }
}

export default BaseRequest;