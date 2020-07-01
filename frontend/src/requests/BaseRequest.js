import apiConfig from './../config/api';
const querystring = require('querystring');

class BaseRequest {

    REQUEST_TYPE = 'BASE';

    constructor( session ){
        this.session = session;
    }
    /*
    create a label to be applied to the redux action for debugging
    */
    getlabel(label, method)
    {
        if(label === '') return method + '_' + this.REQUEST_TYPE;
    }

    getHost = () =>{
        return apiConfig.host + apiConfig.port;
    }

    getEndpoint = () => {
        return this.endpoint;
    }

    /*
    Get an array of objects based on given variables
    */
    get = ({ wheres = [], withs = [], limit = 20, page = 0, label = '', orderBy='', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url :this.getEndpoint() + `?` + this.getWhereString(wheres) + `&` + this.getWithString(withs) + `&limit=` + limit + `&order_by=` + orderBy + `&page=` + page,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET')
        });
    }
    /*
    get a single object based on id 
    */
    getOne = ({ id = null, withs = [], label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url :this.getEndpoint() + `/` + id+ `?` + this.getWithString(withs),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label
        });
    }
    /*
    Create a new object
    */
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
    /*
    delete existing object
    */
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
    /*
    Update existing object
    */
    update = ( { id = null, label = '', data = {}, onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
         return this.apiAction({
            url : this.getEndpoint() + `/` + id,
            method : "PUT",
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label,
            data : data
        });
    }
    /*
    create string to ask for relations
    */
    getWithString = ( withs ) => {
        let withString = '';
        withs.forEach(element => {
            withString += `with[]=${element}&`;
        });
        return withString.slice(0, withString.length - 1);
    }
    /*
    create string with standard `where` key values
    */
    getWhereString = ( wheres ) =>
    {
        return querystring.stringify(wheres);
    }
    /*
    on fail lets send a redux action telling the app of error
    */
    onFailure = (error) =>{
        console.log('error', error);
        return { type : 'API_FAILED'}
    }
    /*
    helper method to format form request
    */
    static createFormRequest = (data = {} ) =>
    {
        const formData = new FormData();
        for (let [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        return formData;
    }
    /*
    wrapper for all requests
    this will send an api action that will be sniffed in the middleware and handled by
    ./frontend/src/middleware/api.js
    */
    apiAction = ({
        url = "",
        method = "GET",
        data = null,
        accessToken = this.session.jwt,
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