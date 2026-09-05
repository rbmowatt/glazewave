const jwt = require('jsonwebtoken');
const cognitoConfig = require('./../config/cognito');

/*
 * A locally signed stand-in for a Cognito access token, so the demo account can
 * be logged into without a user pool.
 *
 * The claims below are not decoration: cognitoAuth verifies issuer, client_id,
 * token_use and the RS256 signature, and reads scope with .split(' '). A token
 * missing any of those fails somewhere further in than it looks like it should.
 */

// Matched against the kid in the token header to pick a verification key, so it
// has to agree with what cognitoAuth merges into its pems map.
const KID = 'glazewave-demo';

// cognitoAuth enforces maxAge 3600 on top of exp, so a longer life here would
// be rejected as a stale token rather than honored.
const TTL_SECONDS = 60 * 60;

const ISSUER = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPool}`;

// Nothing keys off the value, but it has to stay stable across refreshes: it is
// the only thing two demo tokens have in common once exp moves.
const SUBJECT = process.env.DEMO_COGNITO_SUB || '00000000-0000-4000-8000-000000000001';

/*
 * Both keys are base64 in the environment. dotenv only keeps a multi-line value
 * when it is double-quoted, and a PEM pasted into a systemd EnvironmentFile
 * loses its newlines outright - either way the key parses as garbage at sign
 * time rather than at boot.
 */
const decodePem = (value) => {
    if (!value) return null;
    const pem = Buffer.from(value, 'base64').toString('utf8');
    return pem.includes('-----BEGIN') ? pem : null;
};

const privatePem = () => decodePem(process.env.DEMO_JWT_PRIVATE_KEY);
const publicPem = () => decodePem(process.env.DEMO_JWT_PUBLIC_KEY);

// The public key alone is enough to accept a demo token, which is what the
// verify side asks. Minting also needs the private half.
const canVerify = () => process.env.DEMO_ENABLED === '1' && publicPem() !== null;
const canMint = () => canVerify() && privatePem() !== null;

// Runtime, unlike the frontend's REACT_APP_DEMO_PUBLIC, which CRA inlines at
// build time. The two can disagree: the button is hidden while the endpoint
// still answers, until the frontend is rebuilt.
const isPublic = () => process.env.DEMO_PUBLIC === '1';

const keyMatches = (supplied) => {
    const expected = process.env.DEMO_KEY;
    return typeof expected === 'string' && expected.length > 0 && supplied === expected;
};

const mint = () => {
    const token = jwt.sign(
        {
            token_use: 'access',
            // Read with .split(' '), so it cannot be absent or non-string. The
            // value itself is only ever inspected by a human reading a token.
            scope: 'demo',
            username: 'demo',
            client_id: cognitoConfig.clientId,
        },
        privatePem(),
        {
            algorithm: 'RS256',
            keyid: KID,
            issuer: ISSUER,
            subject: SUBJECT,
            expiresIn: TTL_SECONDS,
        }
    );
    return {
        token: token,
        expires_at: jwt.decode(token).exp,
        expires_in: TTL_SECONDS,
    };
};

module.exports = { KID, TTL_SECONDS, publicPem, canVerify, canMint, isPublic, keyMatches, mint };
