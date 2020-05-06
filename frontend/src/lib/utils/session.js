import Cookie from "js-cookie"

// Initialise the Cognito sesson from a callback href
export function hasSession() {
    if(Cookie.get("x-token"))
    {
      return JSON.parse(Cookie.get("x-token"));
    }
    return false;
}
