import BaseRequest from './BaseRequest';

/*
 * The community score endpoints. They hang off /api/board, which is
 * unauthenticated on purpose - a community score is public - but they still go
 * through apiAction so they share the middleware's base URL, error handling and
 * token refresh with every other request in the app.
 */
class BoardRatingRequests extends BaseRequest {
    REQUEST_TYPE = 'BOARD_RATING';

    constructor( session ){
        super(session);
        this.endpoint = '/api/board';
    }

    forBoard = ({ id = null, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/` + id + `/rating`,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }

    /*
     * One request for a page of cards. The list renders from the elasticsearch
     * user_boards index, which carries no score, so the ids are gathered after
     * hydration and asked for together rather than one call per row.
     */
    forBoards = ({ ids = [], label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/ratings?ids=` + ids.join(','),
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }

    topRated = ({ limit = 25, label = '', onSuccess = ()=>{}, onFailure = (e)=>this.onFailure(e) }) => {
        return this.apiAction({
            url : this.getEndpoint() + `/top-rated?limit=` + limit,
            onSuccess : onSuccess,
            onFailure : onFailure,
            label : this.getlabel(label, 'GET'),
        });
    }
}
export default BoardRatingRequests;
