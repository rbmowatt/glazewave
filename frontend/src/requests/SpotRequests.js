import BaseRequest from './BaseRequest';

/*
 * The spot page's endpoints. Everything hangs off /api/spot, whose reads are
 * unauthenticated on purpose - a spot opens from a shared link - but they still
 * go through apiAction so they share the middleware's base URL, token refresh
 * and error handling with every other request in the app.
 *
 * Spot ids carry their provenance and are NOT all one path segment:
 * osm:node/357717358 and wd:Q7644300 have a slash, a Google place id does not.
 * They go into the URL literally. The server's routes are /:id(*) wildcards for
 * exactly that reason, and encodeURIComponent here would work but would also
 * make every request depend on how nginx normalizes %2F - which it does not
 * have to.
 */
class SpotRequests extends BaseRequest {
    REQUEST_TYPE = 'SPOT';

    constructor( session ){
        super(session);
        this.endpoint = '/api/spot';
    }

    // The detail payload: the spot, its default image, the gallery, and the
    // features{} block that says which sections the page may render.
    find = ({ id = null, width = null, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + (width ? `?width=` + width : ``),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }

    photos = ({ id = null, limit = 24, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + `/photos?limit=` + limit,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }

    notes = ({ id = null, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + `/notes`,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }

    addNote = ({ id = null, data = {}, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + `/notes`,
            method : "POST",
            data : data,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label,
        });
    }

    saveDescription = ({ id = null, data = {}, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + `/description`,
            method : "PUT",
            data : data,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : label,
        });
    }
}
export default SpotRequests;
