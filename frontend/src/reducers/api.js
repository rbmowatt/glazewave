const initialState = 0;
const api = (state = initialState, action) => {
let newState = state;
  switch (action.type) {
    case 'API_START':
        return newState +1;
    case 'API_END':
        newState = state-1;
        return newState;  
    default :
        return newState;
}}
export default api;