import axios from 'axios';
import apiConfig from './../config/api';
const querystring = require('querystring');

class BaseRequest {

    constructor( session ){
        this.session = session;
    }

    get = ({ wheres = [], withs = [], limit = 20, page = 0, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url :this.getEndpoint() + `?` + this.getWhereString(wheres) + `&` + this.getWithString(withs),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label
        });
    }

    getOne = ({ id = null, withs = [], label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url :this.getEndpoint() + `/` + id+ `?` + this.getWithString(withs),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label
        });
    }

    create_bk = (data, hdrs = {}) => {
        const headers = {...this.session.headers, ...hdrs};
        return axios.post(this.getEndpoint() , data , headers)
    }

    create = ({ data = {}, hdrs = {}, label = '' , onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) } ) => {
        const headers = {...this.session.headers, ...hdrs};
        return this.apiAction({
            data : data,
            url :this.getEndpoint(),
            method : "POST",
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label,
            //headersOverride : headers
        });
    }

    delete  = ({ id = null, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) =>
    {
        //const headers = {...this.session.headers, ...hdrs};
        return this.apiAction({
            url : this.getEndpoint() + `/` + id,
            method : "DELETE",
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label,
        });
    }

    update = ( entityId, data) => {
        return axios.put(this.getEndpoint() + `/` + entityId , data,  this.session.headers);
    }

    getHost = () =>{
        return apiConfig.host + apiConfig.port;
    }

    getEndpoint = () => {
        return this.endpoint;
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

    onFailure = (error) =>{
        console.log('error', error);
        return { type : 'API_FAILED'}
       
    }

    static createFormRequest = (data = {} ) =>
    {
        const formData = new FormData();
        for (let [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        return formData;
    }

    apiAction = ({
        url = "",
        method = "GET",
        data = null,
        accessToken = null,
        onSuccess = () => {},
        onFailure = () => {},
        label = "",
        headersOverride = null
      }) => {
        return {
          type: "API",
          payload: {
            url,
            method,
            data,
            accessToken,
            onSuccess,
            onFailure,
            label,
            headersOverride
          }
        };
      }
}

export default BaseRequest;