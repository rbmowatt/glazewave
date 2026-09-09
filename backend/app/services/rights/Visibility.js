'use strict';

const db = require('./../../models');
const Op = db.Sequelize.Op;

/*
 * One rule, written once: you may read a row if you own it or it is public.
 *
 * It is applied as an AND against whatever the caller asked for, so a query
 * string can narrow the result and can never widen it. QueryParser puts every
 * unreserved param straight into req.parser.wheres, which is exactly why the
 * scope cannot live there - ?is_public=1 would otherwise be the caller's to
 * set.
 *
 * Deliberately NOT applied inside BaseService.find(). SessionService.update()
 * and delete() read the row through find() before writing it, and a scope that
 * ran there would make an internal read of a private row return nothing. Reads
 * that answer a request go through the *Visible methods below; internal reads
 * stay unscoped and are gated by the ownership check on the route instead.
 */

// A viewer is {id, username} or null. Anonymous sees public rows only.
const ownedOrPublic = (viewer, column = 'user_id') => {
  const clauses = [{ is_public: 1 }];
  if (viewer) clauses.push({ [column]: viewer.id });
  return { [Op.or]: clauses };
};

/*
 * BaseService.where() assigns wheres.id after building its options object and
 * relies on the two being the same reference, so the caller's object has to
 * stay the inner one rather than being copied or flattened.
 */
const scopeWheres = (wheres, viewer, column = 'user_id') => ({
  [Op.and]: [wheres || {}, ownedOrPublic(viewer, column)],
});

// The parser a scoped read should run with. req.parser is left untouched so a
// route can still reach the caller's own filters afterwards.
const scopedParser = (req, column = 'user_id') =>
  Object.assign({}, req.parser, {
    wheres: scopeWheres(req.parser.wheres, req.viewer, column),
  });

const isOwner = (viewer, row, column = 'user_id') =>
  Boolean(viewer && row && String(row[column]) === String(viewer.id));

module.exports = { ownedOrPublic, scopeWheres, scopedParser, isOwner };
