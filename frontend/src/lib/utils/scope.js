/*
The index pages unmount whenever you open a board or a session, so the scope
cannot live in component state alone: goBack() restores the URL, and the
constructor runs again against whatever that URL says. Keeping it in the query
string is what makes it survive the trip, and makes a filtered list a link
somebody can share.

0 = just mine, 1 = mine + public. Anything else reads as 0.
*/
const PARAM = "scope";

export const scopeFromSearch = (search) => {
	const value = new URLSearchParams(search || "").get(PARAM);
	return Number(value) === 1 ? 1 : 0;
};

export const searchWithScope = (search, scope) => {
	const params = new URLSearchParams(search || "");
	if (Number(scope) === 1) params.set(PARAM, "1");
	else params.delete(PARAM);
	const next = params.toString();
	return next ? `?${next}` : "";
};
