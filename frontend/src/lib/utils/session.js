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
      console.log('token expires @', moment.unix(session.expiration).format('MMMM Do YYYY, h:mm:ss a'))
      console.log('current time is', moment().format('MMMM Do YYYY, h:mm:ss a'))
      console.log('update time is', moment.unix(session.expiration).subtract(5, "minutes").format('MMMM Do YYYY, h:mm:ss a'))
      console.log('cookie expues',  current_time, expTime, updateTime);
      if(current_time > updateTime){
        refresh().then(data=> {return true})
        .catch(e=>clearSession())
        return session;
      }
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
    refresh().then(data=>console.log('session data', data))
        .catch(e=>clearSession())
  }
}