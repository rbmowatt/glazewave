const { Router } = require('express');
const UserService = require('./../services/UserService');
const demoToken = require('./../lib/demoToken');

const router = new Router();

const DEMO_USERNAME = process.env.DEMO_USERNAME || 'demo';

/*
 * Mints a token for the demo account so a visitor can see a populated app
 * without a Cognito user pool.
 *
 * Every failure answers 404, including a wrong key. A 401 would confirm the
 * endpoint exists and that the only thing missing is the key, which is the one
 * fact worth not handing out.
 */
const notFound = (res) => res.status(404).send({ message: 'Not found.' });

router.post('/login', function (req, res) {
    if (!demoToken.canMint()) return notFound(res);

    // QueryParser dumps every unreserved param into req.parser.wheres, so k
    // would reach Sequelize as a where clause if this read from there.
    if (!demoToken.isPublic() && !demoToken.keyMatches(req.query.k)) return notFound(res);

    UserService.make().where({ wheres: { username: DEMO_USERNAME } })
        .then(rows => {
            if (!rows || !rows.length) {
                // The account is seeded separately, so an enabled endpoint with
                // no row is a deploy that ran half of the setup.
                res.status(503).send({
                    message: `Demo account "${DEMO_USERNAME}" has not been seeded.`
                });
                return;
            }
            const user = rows[0];
            const minted = demoToken.mint();
            res.send({
                token: minted.token,
                expires_at: minted.expires_at,
                expires_in: minted.expires_in,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            });
        })
        .catch(err => {
            // NODE_ENV=production replaces the message with the bare status
            // phrase, so journalctl is the only place the cause appears.
            console.error('POST /api/demo/login failed:', err);
            res.status(500).send({ message: 'Some error occurred while starting the demo.' });
        });
});

module.exports = router;
