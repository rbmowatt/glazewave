// Get the middleware function that will verify the incoming request
function _getVerifyMiddleware (options) {
  // Fetch the JWKS data used to verify the signature of incoming JWT tokens
  const pemsDownloadProm = _init()
    .catch((err) => {
      // Failed to get the JWKS data - all subsequent auth requests will fail
      console.error(err)
      return { err }
    })
  return function (req, res, next) {
    _verifyMiddleWare(pemsDownloadProm, req, res, next)
  }
}

// One time initialisation to download the JWK keys and convert to PEM format. Returns a promise.
function _init (req, res, next) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${ISSUER}/.well-known/jwks.json`,
      json: true
    }
    request.get(options, function (err, resp, body) {
      if (err) {
        console.debug(`Failed to download JWKS data. err: ${err}`)
        reject(new Error('Internal error occurred downloading JWKS data.')) // don't return detailed info to the caller
        return
      }
      if (!body || !body.keys) {
        console.debug(`JWKS data is not in expected format. Response was: ${JSON.stringify(resp)}`)
        reject(new Error('Internal error occurred downloading JWKS data.')) // don't return detailed info to the caller
        return
      }
      const pems = {}
      for (let i = 0; i < body.keys.length; i++) {
        pems[body.keys[i].kid] = jwkToPem(body.keys[i])
      }
      console.info(`Successfully downloaded ${body.keys.length} JWK key(s)`)
      resolve(pems)
    })
  })
}

exports.getVerifyMiddleware = _getVerifyMiddleware