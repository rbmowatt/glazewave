/*
Shared matcher for the shaper and model type-aheads.

Three manufacturer rows carry a null name in production, and one of them took
the whole widget down: `entity.name.toLowerCase()` threw inside the filter, so
the setState that stores the suggestions never ran and the list stayed empty on
focus and on every keystroke after it. Rows with no value in the key are
dropped here rather than guarded at each call site.

An empty needle returns everything, which is what makes clicking into a field
show the full list.
*/
export const matchSuggestions = (rows, key, value) => {
	const named = (rows || []).filter((row) => !!row[key]);
	const needle = (value || "").trim().toLowerCase();
	if (!needle) return named;
	// Substring, not prefix: the catalog is full of names like "Simon Anderson
	// Surfboards" that nobody types from the front.
	return named.filter((row) => row[key].toLowerCase().indexOf(needle) !== -1);
};
