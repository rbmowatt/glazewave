const db = require("../models");
const BaseModel = db.Session;
const BaseService = require('./BaseService');
const LocationService = require('./LocationService');
const SessionDataModel = db.SessionData;
const resolveConditions = require('./conditions');

const CONDITION_FIELDS = [
    'water_temperature',
    'swell_height',
    'swell_period',
    'wave_height',
    'wave_period',
    'pressure',
    'wind_speed',
];

class SessionService  extends BaseService {

    constructor(){
        super(BaseModel);
    }

    async create(params, callback = null)
    {
        await this.ensureLocation(params);
        const session = await super.create(params, callback);
        await this.syncConditions(session);
        return session;
    }

    async update(id, params, callback = null)
    {
        await this.ensureLocation(params);

        // Read before the write so the two timestamps can be compared. find()
        // returns a fresh instance each call, so this one keeps the old values
        // after super.update() mutates its own.
        const before = await this.find({id: id});
        const session = await super.update(id, params, callback);
        if (!session) return null;

        if (before && this.conditionsAreStale(before, session)) {
            await this.syncConditions(session);
        }
        return session;
    }

    conditionsAreStale(before, after)
    {
        if (String(before.location_id) !== String(after.location_id)) return true;
        const was = before.session_date ? new Date(before.session_date).getTime() : null;
        const now = after.session_date ? new Date(after.session_date).getTime() : null;
        return was !== now;
    }

    /*
     * The server resolves conditions, not the browser. The client used to post
     * them as a JSON blob alongside the session, which meant nothing stopped a
     * payload carrying one day's swell with another day's session_date - and
     * once the date became editable there was no way to tell the pair apart
     * from a correct one.
     *
     * A row is written even when every field comes back null. resolved_at set
     * with null values is how "we looked and there is no marine data here"
     * is recorded, which an absent row cannot say.
     */
    async syncConditions(session)
    {
        if (!session || !session.location_id) return null;

        const location = await db.Location.findByPk(session.location_id);
        if (!location || !location.lat || !location.lng) return null;

        let resolved;
        try {
            resolved = await resolveConditions({
                lat: location.lat,
                lon: location.lng,
                at: session.session_date,
            });
        } catch (e) {
            // A session has to save even when open-meteo is unreachable.
            // resolved_at stays null, which marks the row for a later retry.
            console.error(`conditions lookup failed for session ${session.id}:`, e.message);
            return null;
        }

        const existing = await SessionDataModel.findOne({ where: { session_id: session.id } });
        if (!existing) {
            return SessionDataModel.create(
                Object.assign({ session_id: session.id }, resolved)
            );
        }

        // Anything the user corrected by hand survives a later change of date
        // or spot; everything else moves with it.
        const manual = Array.isArray(existing.manual_fields) ? existing.manual_fields : [];
        CONDITION_FIELDS.forEach((field) => {
            if (manual.indexOf(field) === -1) existing[field] = resolved[field];
        });
        existing.lat = resolved.lat;
        existing.lon = resolved.lon;
        existing.resolved_for = resolved.resolved_for;
        existing.resolved_at = resolved.resolved_at;
        return existing.save();
    }

    // The FK means the locations row has to land first. The old version fired
    // the lookup and the save together and never rejected, so a failed details
    // call left the request hanging open instead of returning an error.
    //
    // The return value is not usable: Sequelize 5 upsert() resolves a boolean,
    // so this hands back an instance for a location already stored and true
    // for one it just created. Read the row back by primary key instead.
    async ensureLocation(params)
    {
        if(!params.location_id) return null;
        return LocationService.make().createFromGoogle(params.location_id);
    }
}

module.exports = SessionService;
