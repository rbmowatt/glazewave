#!/usr/bin/env node
/*
 * Builds the demo account's data: a user, five locations, three boards and
 * roughly eighteen months of sessions with real conditions behind them.
 *
 *   node app/scripts/demo_seed.js --plan-only
 *   node app/scripts/demo_seed.js --reset
 *
 * Sessions are written through SessionService, not queryInterface.bulkInsert,
 * so ensureLocation, the conditions lookup and the elasticsearch hooks all run
 * the same way they do for a session someone actually logs. The existing
 * fixtures bulk-insert, which is why none of that data has ever reached the
 * index and the dashboard averages have always read zero against it.
 *
 * Everything is required lazily so --plan-only runs with no database, no
 * network and no node_modules - which is the only way to check the schedule
 * from a machine where the backend does not install.
 */

const DEMO_USERNAME = process.env.DEMO_USERNAME || 'demo';

// Prefixed so a reset can find them and so they cannot collide with a real
// Google place id, which is what this column normally holds.
const LOCATIONS = [
    {
        id: 'demo_ibsp',
        name: 'Island Beach State Park',
        formatted_address: 'Island Beach State Park, Berkeley Township, NJ 08751',
        vicinity: 'Berkeley Township',
        lat: '39.7900', lng: '-74.0870',
        region: 'nj', tz: 'us-eastern',
    },
    {
        id: 'demo_seaside_park',
        name: 'Seaside Park',
        formatted_address: 'Ocean Ave, Seaside Park, NJ 08752',
        vicinity: 'Seaside Park',
        lat: '39.9270', lng: '-74.0730',
        region: 'nj', tz: 'us-eastern',
    },
    {
        id: 'demo_manasquan_inlet',
        name: 'Manasquan Inlet',
        formatted_address: 'Manasquan Inlet, Manasquan, NJ 08736',
        vicinity: 'Manasquan',
        lat: '40.1030', lng: '-74.0330',
        region: 'nj', tz: 'us-eastern',
    },
    /*
     * Pacific side on purpose. The marine model returns all four wave fields
     * null inside La Paz bay - measured at 24.1426,-110.3128, which comes back
     * null waves with a 23.0C sea surface temperature - so a trip logged there
     * would produce blank conditions and drag the dashboard averages down
     * without ever looking broken.
     */
    {
        id: 'demo_playa_cerritos',
        name: 'Playa Cerritos',
        formatted_address: 'Playa Cerritos, El Pescadero, B.C.S., Mexico',
        vicinity: 'El Pescadero',
        lat: '23.3270', lng: '-110.1770',
        region: 'baja', tz: -7,
    },
    {
        id: 'demo_la_pastora',
        name: 'La Pastora',
        formatted_address: 'La Pastora, Todos Santos, B.C.S., Mexico',
        vicinity: 'Todos Santos',
        lat: '23.4650', lng: '-110.2280',
        region: 'baja', tz: -7,
    },
];

const NJ_SPOTS = LOCATIONS.filter(l => l.region === 'nj').map(l => l.id);
const BAJA_SPOTS = LOCATIONS.filter(l => l.region === 'baja').map(l => l.id);
const BY_ID = LOCATIONS.reduce((acc, l) => Object.assign(acc, {[l.id]: l}), {});

/*
 * Resolved by model name against whatever the catalog holds, with a fallback,
 * because boards is populated by the harvester and the ids are not stable
 * between environments.
 */
const BOARDS = [
    {
        slot: 'short',
        model: 'The Solution',
        name: 'the white one',
        size: "5'11",
        rating: 8,
        notes: 'Winter board. Wants something with actual push behind it.',
    },
    {
        slot: 'mid',
        model: 'Taylor Jensen Pro Mid',
        name: 'workhorse',
        size: "7'6",
        rating: 9,
        notes: 'Rides more days than the other two put together.',
    },
    {
        slot: 'log',
        model: 'CI Log',
        name: 'the barge',
        size: "9'2",
        rating: 7,
        notes: 'Summer slop board. Heavy to carry over the dune.',
    },
];

// Sessions per calendar month on the Jersey coast. September and October carry
// the hurricane swell and the first nor'easters; July is knee high and warm.
const NJ_PER_MONTH = {1: 6, 2: 5, 3: 8, 4: 9, 5: 8, 6: 5, 7: 4, 8: 6, 9: 12, 10: 13, 11: 11, 12: 7};

const TRIP_DAYS = 10;
const TRIP_SESSIONS = 7;

// Deterministic, so two runs of the same seed produce the same log and a
// change in the output means a change in this file.
const mulberry32 = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const between = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

/*
 * Second Sunday in March to first Sunday in November. Pinning New Jersey at -4
 * year round put every January session at 5am local, which is an hour and a
 * half before sunrise there - a dawn patrol logged in the dark.
 *
 * Baja is a fixed -7: Mexico dropped daylight saving nationwide in 2022.
 */
const nthSundayUTC = (year, month, n) => {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const offset = (7 - first.getUTCDay()) % 7;
    return Date.UTC(year, month - 1, 1 + offset + (n - 1) * 7);
};

const offsetFor = (tz, year, month, day) => {
    if (typeof tz === 'number') return tz;
    const t = Date.UTC(year, month - 1, day);
    return (t >= nthSundayUTC(year, 3, 2) && t < nthSundayUTC(year, 11, 1)) ? -4 : -5;
};

/*
 * A session gets a UTC timestamp built from the spot's own offset, because the
 * conditions resolver floors to a UTC hour. Storing a naive local time would
 * pull the Baja sessions seven hours off the swell they were logged in.
 */
const atLocalHour = (year, month, day, localHour, tz) =>
    new Date(Date.UTC(year, month - 1, day, localHour - offsetFor(tz, year, month, day), 0, 0, 0));

const monthsBack = (now, count) => {
    const out = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        out.push({year: d.getUTCFullYear(), month: d.getUTCMonth() + 1});
    }
    return out;
};

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const tripWindows = (now, rand) => {
    // Both inside the last twelve months, far enough apart to read as two
    // separate trips rather than one long stay.
    const starts = [10, 5].map((monthsAgo) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, between(rand, 4, 16)));
        return d;
    });
    return starts.map((start) => {
        const end = new Date(start.getTime());
        end.setUTCDate(end.getUTCDate() + TRIP_DAYS - 1);
        return {start, end};
    });
};

const tripDaysIn = (trips, year, month, last) => {
    let count = 0;
    for (let day = 1; day <= last; day++) {
        const t = Date.UTC(year, month - 1, day);
        if (trips.some(trip => t >= Date.UTC(trip.start.getUTCFullYear(), trip.start.getUTCMonth(), trip.start.getUTCDate())
            && t <= Date.UTC(trip.end.getUTCFullYear(), trip.end.getUTCMonth(), trip.end.getUTCDate()))) count++;
    }
    return count;
};

const withinTrip = (date, trips) =>
    trips.some(t => date.getTime() >= t.start.getTime() && date.getTime() <= t.end.getTime());

function planSessions ({months = 18, seed = 20260905, now = new Date()} = {}) {
    const rand = mulberry32(seed);
    const trips = tripWindows(now, rand);
    const planned = [];

    for (const trip of trips) {
        const used = new Set();
        while (used.size < TRIP_SESSIONS) {
            const offset = between(rand, 0, TRIP_DAYS - 1);
            if (used.has(offset)) continue;
            used.add(offset);
            const day = new Date(trip.start.getTime());
            day.setUTCDate(day.getUTCDate() + offset);
            const spot = BY_ID[pick(rand, BAJA_SPOTS)];
            planned.push({
                location_id: spot.id,
                trip: true,
                // Offshore until mid-morning down there, so nobody is surfing at noon.
                date: atLocalHour(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(),
                    between(rand, 7, 10), spot.tz),
            });
        }
    }

    for (const {year, month} of monthsBack(now, months)) {
        const last = daysInMonth(year, month);
        // Days already spent on a trip come off the month's home total. Without
        // this, November read as a full Jersey month plus a week in Baja.
        const away = tripDaysIn(trips, year, month, last);
        const target = Math.round(NJ_PER_MONTH[month] * (1 - (away / last)));
        const used = new Set();
        let attempts = 0;
        while (used.size < target && attempts < target * 12) {
            attempts++;
            const day = between(rand, 1, last);
            if (used.has(day)) continue;
            const spot = BY_ID[pick(rand, NJ_SPOTS)];
            const date = atLocalHour(year, month, day, between(rand, 7, 10), spot.tz);
            if (date.getTime() > now.getTime()) continue;
            if (withinTrip(date, trips)) continue;
            used.add(day);
            planned.push({location_id: spot.id, trip: false, date});
        }
    }

    planned.sort((a, b) => a.date - b.date);
    return planned;
}

// Conditions come back null wherever the model has no water, so every read of
// them has to tolerate it rather than doing arithmetic on null.
const ft = (conditions) => (conditions && conditions.wave_height !== null) ? conditions.wave_height : null;
const period = (conditions) => (conditions && conditions.wave_period !== null) ? conditions.wave_period : null;

/*
 * Thresholds come from the run's own resolved heights, not from fixed numbers.
 * open-meteo reports significant wave height, and on the Jersey coast that sits
 * between 2 and 4ft on most days: a fixed 2/4 split put eleven of fourteen
 * sampled sessions on the same board, which tells a demo viewer nothing about
 * why anyone owns three.
 */
const DEFAULT_THRESHOLDS = {small: 2, big: 4};

function boardThresholds (conditionsList) {
    const heights = conditionsList.map(ft).filter(h => h !== null).sort((a, b) => a - b);
    if (heights.length < 3) return DEFAULT_THRESHOLDS;
    const at = (p) => heights[Math.min(heights.length - 1, Math.floor(heights.length * p))];
    return {small: at(0.33), big: at(0.66)};
}

function pickBoard (conditions, bySlot, thresholds = DEFAULT_THRESHOLDS) {
    const h = ft(conditions);
    if (h === null) return bySlot.mid;
    if (h >= thresholds.big) return bySlot.short;
    if (h >= thresholds.small) return bySlot.mid;
    return bySlot.log;
}

function rate (conditions, rand) {
    const h = ft(conditions);
    const p = period(conditions);
    if (h === null) return between(rand, 4, 7);
    const wind = (conditions.wind_speed === null) ? 8 : conditions.wind_speed;
    let score = 2 + (h * 1.1) + ((p === null ? 6 : p) - 5) * 0.4;
    if (wind > 18) score -= 1.5;
    score += (rand() * 2) - 1;
    return Math.max(1, Math.min(10, Math.round(score)));
}

const TITLES = {
    big: ['Solid one at {spot}', '{spot}, overhead sets', 'Big morning at {spot}'],
    medium: ['{spot} before work', 'Chest high at {spot}', 'Fun one at {spot}',
        'Quick one at {spot}', '{spot} on the incoming', 'Waist to chest at {spot}'],
    small: ['Knee slappers at {spot}', '{spot}, barely there', 'Log session at {spot}'],
    blank: ['Paddle out at {spot}'],
};

/*
 * Keyed on the rating, not on wave height. Keyed on height, a two foot morning
 * could draw "best session in a while" while the score said 4, and the pair
 * reads as generated the moment anyone looks at both.
 */
const NOTES = {
    poor: [
        'Not worth the drive. Sat around waiting for a set that never came.',
        'Blown out by the time I got wet.',
        'Should have stayed in bed. Two waves in an hour.',
        'Closing out end to end. Gave up early.',
    ],
    ok: [
        'Nothing special but I got my waves.',
        'Fun and rippable. Went right most of the session.',
        'Started clean and got bumpy once the wind swung.',
        'Peaky and shifting around. Had to keep moving to stay on it.',
        'Crowded but everyone was friendly enough.',
    ],
    great: [
        'Clean lines, nobody out. The kind of morning that makes the early alarm worth it.',
        'Two hours, lost count. Best session in a while.',
        'Long walls, made most of them. Stayed until my arms gave out.',
        'One of those days you remember. Glassy the whole time.',
    ],
    blank: [
        'Logged after the fact, no conditions data for this one.',
    ],
};

const noteBand = (rating) => (rating <= 4 ? 'poor' : (rating >= 8 ? 'great' : 'ok'));

const bucket = (conditions) => {
    const h = ft(conditions);
    if (h === null) return 'blank';
    if (h >= 4) return 'big';
    if (h >= 2) return 'medium';
    return 'small';
};

const describe = (conditions, spotName, rand, rating) => {
    const b = bucket(conditions);
    const title = pick(rand, TITLES[b]).replace('{spot}', spotName);
    let note = pick(rand, b === 'blank' ? NOTES.blank : NOTES[noteBand(rating)]);
    if (conditions && conditions.wind_speed !== null && conditions.wind_speed > 18) {
        note += ' Wind was up the whole time.';
    }
    if (conditions && conditions.water_temperature !== null && conditions.water_temperature < 48) {
        note += ' Hood and gloves.';
    }
    return {title, note};
};

const arg = (name, fallback) => {
    const hit = process.argv.find(a => a.startsWith(`--${name}=`));
    return hit ? hit.split('=')[1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main () {
    const months = Number(arg('months', 18));
    const seed = Number(arg('seed', 20260905));
    const planned = planSessions({months, seed});

    if (flag('plan-only')) {
        const perSpot = {};
        for (const p of planned) perSpot[p.location_id] = (perSpot[p.location_id] || 0) + 1;
        for (const p of planned) console.log(p.date.toISOString(), p.trip ? 'TRIP' : '    ', p.location_id);
        console.log(`\n${planned.length} sessions over ${months} months`);
        console.log(perSpot);
        return;
    }

    require('dotenv').config();
    const db = require('./../models');
    const SessionService = require('./../services/SessionService');
    const UserBoardService = require('./../services/UserBoardService');
    const rand = mulberry32(seed + 1);

    const [user] = await db.User.findOrCreate({
        where: {username: DEMO_USERNAME},
        defaults: {
            username: DEMO_USERNAME,
            first_name: 'Demo',
            last_name: 'Account',
            email: `${DEMO_USERNAME}@glazewave.com`,
            is_active: 1,
            type_id: 1,
        },
    });
    console.log(`user ${DEMO_USERNAME} -> id ${user.id}`);

    if (flag('reset')) {
        // Through the models, so the afterDestroy hooks clear the elasticsearch
        // documents. A raw DELETE leaves both indexes holding rows that no
        // longer exist, and the dashboard counts them.
        const sessions = await db.Session.findAll({where: {user_id: user.id}});
        for (const session of sessions) {
            await db.SessionData.destroy({where: {session_id: session.id}});
            await session.destroy();
        }
        // Sessions first: sessions.board_id is a foreign key onto user_boards.
        const boards = await db.UserBoard.findAll({where: {user_id: user.id}});
        for (const board of boards) await board.destroy();
        console.log(`reset: removed ${sessions.length} sessions and ${boards.length} boards`);
    }

    for (const spec of LOCATIONS) {
        await db.Location.upsert({
            id: spec.id,
            name: spec.name,
            formatted_address: spec.formatted_address,
            vicinity: spec.vicinity,
            lat: spec.lat,
            lng: spec.lng,
            url: `https://www.google.com/maps/search/?api=1&query=${spec.lat},${spec.lng}`,
            is_public: 1,
        });
    }
    console.log(`locations: ${LOCATIONS.length} ready`);

    const bySlot = {};
    for (const spec of BOARDS) {
        let catalog = await db.Board.findOne({where: {model: spec.model}});
        if (!catalog) {
            catalog = await db.Board.findOne();
            if (!catalog) throw new Error('boards table is empty - run the catalog import first');
            console.log(`  "${spec.model}" not in the catalog, falling back to "${catalog.model}"`);
        }
        const existing = await db.UserBoard.findOne({where: {user_id: user.id, name: spec.name}});
        bySlot[spec.slot] = existing || await UserBoardService.make().create({
            name: spec.name,
            size: spec.size,
            rating: spec.rating,
            notes: spec.notes,
            user_id: user.id,
            board_id: catalog.id,
            is_public: 1,
        });
        console.log(`board ${spec.slot}: ${spec.name} (${catalog.model}) -> id ${bySlot[spec.slot].id}`);
    }

    /*
     * Resolved in a pass of its own so the board thresholds can be computed
     * from the whole run before any session is written. SessionService looks
     * the same hours up again inside create(), but conditions caches on point
     * and hour for two hours, so the second pass costs no requests.
     */
    const resolveConditions = require('./../services/conditions');
    console.log(`conditions: resolving ${planned.length} sessions`);
    const resolved = [];
    let blank = 0;
    for (const item of planned) {
        const spot = BY_ID[item.location_id];
        let conditions = null;
        try {
            conditions = await resolveConditions({lat: spot.lat, lon: spot.lng, at: item.date});
        } catch (e) {
            console.error(`  conditions failed for ${spot.name} ${item.date.toISOString()}: ${e.message}`);
        }
        if (!conditions || ft(conditions) === null) blank++;
        resolved.push({item, spot, conditions});
        if (resolved.length % 20 === 0) console.log(`  ${resolved.length}/${planned.length}`);
        // open-meteo allows 600 requests a minute and each session costs two on
        // a cache miss. This keeps a full run under a third of that.
        await sleep(200);
    }

    const thresholds = boardThresholds(resolved.map(r => r.conditions));
    console.log(`conditions: ${blank} with no marine data`);
    console.log(`boards: log under ${thresholds.small}ft, mid to ${thresholds.big}ft, shortboard above`);

    console.log(`sessions: creating ${planned.length}`);
    let made = 0;
    for (const {item, spot, conditions} of resolved) {
        const board = pickBoard(conditions, bySlot, thresholds);
        const rating = rate(conditions, rand);
        const {title, note} = describe(conditions, spot.name, rand, rating);

        await SessionService.make().create({
            title: title,
            rating: rating,
            notes: note,
            is_public: 1,
            user_id: user.id,
            board_id: board.id,
            location_id: spot.id,
            session_date: item.date,
        });
        made++;
        if (made % 20 === 0) console.log(`  ${made}/${planned.length}`);
    }
    console.log(`sessions: ${made} created`);

    await db.sequelize.close();

    /*
     * The model hooks queue their index writes on a five second batch delay, so
     * exiting here would drop whatever is still pending. Backfilling from MySQL
     * instead makes the index a function of the table rather than of how long
     * the process happened to stay alive.
     */
    const {spawnSync} = require('child_process');
    const result = spawnSync(process.execPath, [require('path').join(__dirname, 'backfill_elastic.js')], {stdio: 'inherit'});
    process.exit(result.status === null ? 1 : result.status);
}

module.exports = {planSessions, pickBoard, rate, bucket, boardThresholds, describe, LOCATIONS, BOARDS};

if (require.main === module) {
    main().catch((err) => { console.error(err); process.exit(1); });
}
