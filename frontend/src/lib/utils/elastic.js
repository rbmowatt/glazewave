import TokenStorage from './token_storage';

// ReactiveSearch issues its own fetches and never passes through the axios
// middleware, so the bearer token has to be handed to ReactiveBase directly.
// Read at render time: reactivecore deep-compares this prop, so returning a
// fresh object with an unchanged token does not retrigger a query.
export const esHeaders = () => ({
    Authorization: `Bearer ${TokenStorage.getAccessToken()}`
});
