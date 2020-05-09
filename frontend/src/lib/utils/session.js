import Cookie from "js-cookie"

// Initialise the Cognito sesson from a callback href
export function hasSession() {
    if(Cookie.get("x-token"))
    {
      const session = JSON.parse(Cookie.get("x-token"));
      var current_time = Date.now() / 1000;
      if ( session.expiration > current_time) {
        return session;
      }
    }
  return false;
}

export function clearSession() {
  if(Cookie.get("x-token"))
  {
    Cookie.remove("x-token")
  }
return false;
}