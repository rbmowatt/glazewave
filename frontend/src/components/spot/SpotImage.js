import './css/SpotImage.css';
import React from 'react';

/*
 * The photograph attached to a spot, and the credit its licence requires.
 *
 * The API omits `image` entirely for a spot with no photograph rather than
 * sending null - 289 of the 1,611 seeded spots have none - so absence is the
 * only signal there is. The placeholder exists so a list where only some rows
 * have a photo does not stagger.
 */
export const SpotThumb = ({ image, size = 40 }) => {
  const style = { width: size, height: size, flexBasis: size };

  if (!image || !image.url) {
    return <span className="gw-spot-thumb gw-spot-thumb-empty" style={style} aria-hidden="true" />;
  }

  return (
    <img
      className="gw-spot-thumb"
      style={style}
      src={image.url}
      width={size}
      height={size}
      loading="lazy"
      /*
       * No srcset here. The list routes ask for 400, which is the smallest rung
       * built, so every other entry would only give the browser a chance to
       * fetch something larger than a 40px box needs.
       *
       * Empty alt on purpose: the spot name is rendered immediately beside this
       * and a screen reader repeating it is noise, not information.
       */
      alt=""
    />
  );
};

/*
 * 1,120 of the 1,322 default images are CC BY or CC BY-SA and the credit has to
 * appear wherever the image does. The other 202 are CC0 or public domain and
 * carry `credit: null` - inventing a line for those would be wrong rather than
 * merely redundant, so this renders nothing at all.
 */
export const SpotCredit = ({ image, className = 'gw-spot-credit' }) => {
  if (!image || !image.credit) return null;

  return (
    <span className={className} title={image.credit}>
      {image.credit_url ? (
        <a href={image.credit_url} target="_blank" rel="noopener noreferrer nofollow">
          {image.credit}
        </a>
      ) : image.credit}
    </span>
  );
};

/*
 * The credit for a row of thumbnails, where the full line does not fit.
 *
 * One photograph is the default for as many as ten adjacent spots on the same
 * beach, so the same name turns up repeatedly in a nearby list - hence the
 * dedupe. Spots whose image needs no attribution contribute nothing.
 */
export const photoCredits = (spots = []) => {
  const names = [];
  spots.forEach((spot) => {
    const image = spot && spot.image;
    if (!image || !image.credit || !image.author) return;
    if (names.indexOf(image.author) === -1) names.push(image.author);
  });
  return names;
};

export const PhotoCreditLine = ({ spots }) => {
  const names = photoCredits(spots);
  if (!names.length) return null;
  return (
    <span className="gw-spot-credit-line">
      {'Photos: ' + names.join(', ') + ', via Wikimedia Commons'}
    </span>
  );
};

export default SpotThumb;
