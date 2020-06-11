import Cookie from "js-cookie";
import moment from "moment";
import { refresh } from './cognito'

export function setSessionCookie(session)
{
  Cookie.set("x-token", session);
}
// Initialise the Cognito sesson from a callback href
export function hasSession() {
    if(Cookie.get("x-token"))
    {
      console.log('hid')
      const session = JSON.parse(Cookie.get("x-token"));
      const current_time = moment.unix(session.expiration).valueOf();
      const expTime = moment.unix(moment.now()).valueOf();
      console.log('cookie expues',  current_time, expTime);
      if ( expTime > current_time) {
        console.log('dude')
        return session;
      }
      else {
        console.log('hi')
        refresh().then(data=>console.log('session data', data))
        .catch(e=>clearSession())
      }
     // clearSession();
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