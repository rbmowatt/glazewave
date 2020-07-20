const initialState = { count : 0, authorized : true};
const api = (state = initialState, action) => {
  switch (action.type) {
    case 'API_START':
        return  {...state, ...{count : state.count + 1}};
    case 'API_END':
        return  {...state, ...{count : state.count - 1}};
    case 'API_401':
        return  {...state, ...{authorized : false}};
    default :
        return state;
}}
export default api;