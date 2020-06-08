import { CLEAR_SESSION, SET_SESSION } from './types'

export const clearSession = () => ({
  type: CLEAR_SESSION
})


export const setSession = session => ({
  type: SET_SESSION,
  session
})