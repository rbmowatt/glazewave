const initialState = [];
const shapers = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SHAPERS':
      return action.payload;
    default:
      return state
  }
}
export default shapers;