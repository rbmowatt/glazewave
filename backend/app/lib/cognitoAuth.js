const jwkToPem = require('jwk-to-pem')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const cognitoConfig = require('./../config/cognito');
const demoToken = require('./demoToken');

const TOKEN_USE_ACCESS = 'access'
const TOKEN_USE_ID = 'id'

const MAX_TOKEN_AGE = 60 * 60 // 3600 seconds
const ALLOWED_TOKEN_USES = [TOKEN_USE_ACCESS, TOKEN_USE_ID]
const ISSUER = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPool}`

class AuthError extends Error {}

// Memoized. The verify middleware and the optional viewer lookup both need the
// keys, and a second call here would start a second JWKS download at boot.
let pemsDownloadProm = null

function _getPems () {
  if (pemsDownloadProm) return pemsDownloadProm
  pemsDownloadProm = _init()
    .catch((err) => {
      // Failed to get the JWKS data - all subsequent auth requests will fail
      console.error(err)
      // Except demo ones. The demo key is local, so it is still usable while
      // Cognito is unreachable, which is the one condition a login that does
      // not depend on Cognito exists to survive. Returning { err } instead
      // would take the demo down with the outage.
      const demoPem = demoToken.canVerify() ? demoToken.publicPem() : null
      if (demoPem) return { [demoToken.KID]: demoPem }
      return { err }
    })
  return pemsDownloadProm
}

// Get the middleware function that will verify the incoming request
function _getVerifyMiddleware () {
  const pems = _getPems()
  return function (req, res, next) {
    _verifyMiddleWare(pems, req, res, next)
  }
}

// Verify an Authorization header and resolve its claims, writing nothing to the
// response. Rejects with AuthError when the caller is at fault and with a plain
// Error when the JWKS download failed: an optional-auth path has to tell "no
// usable token" from "cannot check tokens at all", because the first is an
// anonymous visitor and the second would silently downgrade a signed-in one.
function _verify (auth) {
  return _getPems().then((pems) => _verifyProm(pems, auth))
}

// One time initialisation to download the JWK keys and convert to PEM format. Returns a promise.
async function _init () {
  let body
  try {
    const resp = await axios.get(`${ISSUER}/.well-known/jwks.json`)
    body = resp.data
  } catch (err) {
    console.debug(`Failed to download JWKS data. err: ${err}`)
    throw new Error('Internal error occurred downloading JWKS data.') // don't return detailed info to the caller
  }
  if (!body || !body.keys) {
    console.debug(`JWKS data is not in expected format. Response was: ${JSON.stringify(body)}`)
    throw new Error('Internal error occurred downloading JWKS data.') // don't return detailed info to the caller
  }
  const pems = {}
  for (const key of body.keys) {
    pems[key.kid] = jwkToPem(key)
  }
  console.info(`Successfully downloaded ${body.keys.length} JWK key(s)`)
  // Merged rather than special-cased in _verifyProm so a demo token walks the
  // same issuer, client_id, token_use and maxAge checks a Cognito one does.
  // The kid is what separates them, and Cognito will not mint that kid.
  if (demoToken.canVerify()) {
    pems[demoToken.KID] = demoToken.publicPem()
    console.info('Demo signing key enabled')
  }
  return pems
}

// Verify the Authorization header and call the next middleware handler if appropriate
function _verifyMiddleWare (pemsDownloadProm, req, res, next) {
  pemsDownloadProm.then((pems) => {
    return _verifyProm(pems, req.get('Authorization'))
  })
    .then((decoded) => {
      // Caller is authorised - copy some useful attributes into the req object for later use
      console.debug(`Valid JWT token. Decoded: ${JSON.stringify(decoded)}.`)
      req.user = {
        sub: decoded.sub,
        token_use: decoded.token_use
      }
      if (decoded.token_use === TOKEN_USE_ACCESS) {
        // access token specific fields
        req.user.scope = decoded.scope.split(' ')
        req.user.username = decoded.username
      }
      if (decoded.token_use === TOKEN_USE_ID) {
        // id token specific fields
        req.user.email = decoded.email
        req.user.username = decoded['cognito:username']
      }
      next()
    })
    .catch((err) => {
      const status = (err instanceof AuthError ? 401 : 500) // Either not auth or internal error
      res.status(status).send(err.message || err)
    })
}

// Verify the Authorization header and return a promise.
function _verifyProm (pems, auth) {
  return new Promise((resolve, reject) => {
    if (pems.err) {
      reject(new Error(pems.err.message || pems.err))
      return
    }

    // Check the format of the auth header string and break out the JWT token part
    if (!auth || auth.length < 10) {
      reject(new AuthError('Invalid or missing Authorization header. Expected to be in the format \'Bearer <your_JWT_token>\'.'))
      return
    }
    const authPrefix = auth.substring(0, 7).toLowerCase()
    if (authPrefix !== 'bearer ') {
      reject(new AuthError('Authorization header is expected to be in the format \'Bearer <your_JWT_token>\'.'))
      return
    }
    const token = auth.substring(7)

    // Decode the JWT token so we can match it to a key to verify it against
    const decodedNotVerified = jwt.decode(token, { complete: true })
    if (!decodedNotVerified) {
      console.debug(`Invalid JWT token. jwt.decode() failure.`)
      reject(new AuthError('Authorization header contains an invalid JWT token.')) // don't return detailed info to the caller
      return
    }
    if (!decodedNotVerified.header.kid || !pems[decodedNotVerified.header.kid]) {
      console.debug(`Invalid JWT token. Expected a known KID ${JSON.stringify(Object.keys(pems))} but found ${decodedNotVerified.header.kid}.`)
      reject(new AuthError('Authorization header contains an invalid JWT token.')) // don't return detailed info to the caller
      return
    }

    // Now verify the JWT signature matches the relevant key
    // jsonwebtoken 9 infers allowed algorithms from the key, which would still admit
    // any RS/PS/ES variant. Cognito only ever signs with RS256, so pin it.
    jwt.verify(token, pems[decodedNotVerified.header.kid], {
      algorithms: ['RS256'],
      issuer: ISSUER,
      maxAge: MAX_TOKEN_AGE
    },
    function (err, decodedAndVerified) {
      if (err) {
        console.debug(`Invalid JWT token. jwt.verify() failed: ${err}.`)
        if (err instanceof jwt.TokenExpiredError) {
          reject(new AuthError(`Authorization header contains a JWT token that expired at ${err.expiredAt.toISOString()}.`))
        } else {
          reject(new AuthError('Authorization header contains an invalid JWT token.')) // don't return detailed info to the caller
        }
        return
      }

      // The signature matches so we know the JWT token came from our Cognito instance, now just verify the remaining claims in the token

      // Verify the token_use matches what we've been configured to allow
      if (ALLOWED_TOKEN_USES.indexOf(decodedAndVerified.token_use) === -1) {
        console.debug(`Invalid JWT token. Expected token_use to be ${JSON.stringify(ALLOWED_TOKEN_USES)} but found ${decodedAndVerified.token_use}.`)
        reject(new AuthError('Authorization header contains an invalid JWT token.')) // don't return detailed info to the caller
        return
      }

      // Verify the client id matches what we expect. Will be in either the aud or the client_id claim depending on whether it's an id or access token.
      const clientId = (decodedAndVerified.aud || decodedAndVerified.client_id)
      if (clientId !== cognitoConfig.clientId) {
        console.debug(`Invalid JWT token. Expected client id to be ${cognitoConfig.clientId} but found ${clientId}.`)
        reject(new AuthError('Authorization header contains an invalid JWT token.')) // don't return detailed info to the caller
        return
      }

      // Done - all JWT token claims can now be trusted
      return resolve(decodedAndVerified)
    })
  })
}

exports.getVerifyMiddleware = _getVerifyMiddleware
exports.verify = _verify
exports.AuthError = AuthError