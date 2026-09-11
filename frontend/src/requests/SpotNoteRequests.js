import BaseRequest from './BaseRequest';

/*
 * Editing and hiding one note, by note id.
 *
 * Its own request class because the routes are on their own mount: a note id
 * is enough to find a note, so the server does not hang these under the spot
 * router's wildcard. update() and delete() off BaseRequest are the right shape
 * already - only the endpoint differs.
 */
class SpotNoteRequests extends BaseRequest {
    REQUEST_TYPE = 'SPOT_NOTE';

    constructor( session ){
        super(session);
        this.endpoint = '/api/spot-note';
    }
}
export default SpotNoteRequests;
