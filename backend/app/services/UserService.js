const db = require("../models");
const BaseModel = db.User;
const BaseService = require('./BaseService');
const getElasticClient = require('./elastic/client');
const esb = require('elastic-builder');

const TREND_MONTHS = 12;

/*
 * Buckets are UTC, which is what the sessions are stored in. A session logged
 * in the small hours of the first of a month lands in the previous month for
 * anyone west of Greenwich; the alternative is asking the browser for its
 * offset, and a trend that shifts depending on where you open it is worse.
 */
const monthKey = (date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const trendBounds = () => {
    const now = new Date();
    return {
        from: monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (TREND_MONTHS - 1), 1))),
        to: monthKey(now),
    };
};



class UserService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    getUserAverages(parser)
    {
        return new Promise((resolve, reject)=>{
        const client = getElasticClient();
        const requestBody = esb.requestBodySearch()
            .size(0)
            .agg(esb.avgAggregation('wave_period', 'wave_period'))
            .agg(esb.avgAggregation('wave_height', 'wave_height'))
            .agg(esb.avgAggregation('swell_height', 'swell_height'))
            .agg(esb.avgAggregation('swell_period', 'swell_period'))
            .agg(esb.avgAggregation('water_temperature', 'water_temperature'))
            .agg(esb.avgAggregation('wind_speed', 'wind_speed'))
            .agg(esb.avgAggregation('session_rating', 'rating'))
            .agg(esb.valueCountAggregation('total_sessions', 'id'))
            /*
             * The dashboard used to count distinct spots in the browser, over
             * whatever the session list request happened to return - which is
             * twenty rows by default, so anyone past their twentieth session
             * saw an undercount that never moved again.
             */
            .agg(esb.cardinalityAggregation('distinct_spots', 'location'))
            .query(esb.matchQuery('user_id', parser.id));

        const body = requestBody.toJSON();
        const bounds = trendBounds();

        /*
         * Spliced in rather than built with elastic-builder: 2.7.1 predates
         * calendar_interval and emits `interval`, which ES 7 answers with a
         * deprecation warning and ES 8 rejects outright. The client is pinned
         * to ~7.17 for the cluster's sake, so the query is written by hand
         * instead of being held back to what that version can express.
         *
         * extended_bounds only widens the range, it does not clip it, so a
         * user with three years of sessions still gets a bucket per month all
         * the way back. The slice below is what bounds the response.
         */
        body.aggs.rating_trend = {
            date_histogram: {
                field: 'session_date',
                calendar_interval: 'month',
                format: 'yyyy-MM',
                min_doc_count: 0,
                extended_bounds: {min: bounds.from, max: bounds.to},
            },
            aggs: {
                avg_rating: {avg: {field: 'rating'}},
                rated: {value_count: {field: 'rating'}},
            },
        };

        client
        .search({
            index: process.env.ELASTIC_SESSIONS_INDEX,
            body: body
        })
        .then(resp => {
            const aggregations = resp.body.aggregations;
            const parsedValues = {};
            let val = 0.0;
            //here we'll clean up the response a bit and round things off
            for (const [key, value] of Object.entries(aggregations)) {
                // A date_histogram carries buckets, not a value. Reading
                // .value off it yields undefined and this loop would report
                // the whole trend as 0.0 with nothing in the logs.
                if (key === 'rating_trend') continue;
                // A count of places is not a measurement, and toFixed(1)
                // turned five spots into the string "5.0" on the card.
                if (key === 'distinct_spots') {
                    parsedValues[key] = value.value || 0;
                    continue;
                }
                val = value.value ? value.value.toFixed(1) : 0.0;
                parsedValues[key] = val;
            }
            parsedValues.rating_trend = (aggregations.rating_trend.buckets || [])
                .filter(bucket => bucket.key_as_string >= bounds.from)
                .map(bucket => ({
                    month: bucket.key_as_string,
                    // doc_count counts every session in the month; a session
                    // can be saved without a rating, so the two differ and the
                    // trend header is counting the rated ones.
                    sessions: bucket.doc_count,
                    rated: bucket.rated.value,
                    rating: bucket.avg_rating.value === null
                        ? null
                        : Number(bucket.avg_rating.value.toFixed(2)),
                }));
            resolve(parsedValues)
        })
        .catch(err => {
            reject(err.message);
        });
    });
    }
}

module.exports = UserService;