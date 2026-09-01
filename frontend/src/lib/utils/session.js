import Cookie from "js-cookie";
import moment from "moment";
import { refresh } from './cognito'

export function setSessionCookie(session)
{
  //Cookie.set("x-token", session);
  localStorage.setItem('x-token', JSON.stringify(session))
}
// Initialise the Cognito sesson from a callback href
export function hasSession() {
    if(localStorage.getItem('x-token'))
    {
      const session = JSON.parse(localStorage.getItem('x-token'));
      const expTime = moment.unix(session.expiration).valueOf();
      const current_time = moment().valueOf();
      const updateTime =  moment.unix(session.expiration).subtract(5, "minutes").valueOf();
      if(current_time > updateTime){
        refresh().then(data=> {return true})
        .catch(e=>clearSession())
        return session;
      }
      if ( expTime > current_time) {
        return session;
      }
      else {
        refresh().then(data=>/* console.log removed */)
        .catch(e=>clearSession())
      }
    }
  return false;
}

export function clearSession() {
  if(localStorage.getItem('x-token'))
  {
    localStorage.removeItem("x-token")
  }
return false;
}

export function update()
{
  if(!hasSession())
  {
    refresh().then(data=>/* console.log removed */)
        .catch(e=>clearSession())
  }
}