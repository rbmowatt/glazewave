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
      const session = JSON.parse(Cookie.get("x-token"));
      const expTime = moment.unix(session.expiration).valueOf();
      const current_time = moment().valueOf();
      console.log('token expires @', moment.unix(session.expiration).format('MMMM Do YYYY, h:mm:ss a'))
      console.log('current time is', moment().format('MMMM Do YYYY, h:mm:ss a'))
      console.log('cookie expues',  current_time, expTime);
      if ( expTime > current_time) {
        return session;
      }
      else {
        refresh().then(data=>console.log('session data', data))
        .catch(e=>clearSession())
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

export function update()
{
  if(!hasSession())
  {
    refresh().then(data=>console.log('session data', data))
        .catch(e=>clearSession())
  }
}