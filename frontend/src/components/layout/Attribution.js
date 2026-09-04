import * as React from 'react';

/*
 * Licence obligation, not decoration. Spot rows come from OpenStreetMap under
 * ODbL and conditions from Open-Meteo under CC BY 4.0, and both require
 * visible credit wherever the data is published.
 */
const Attribution = () => (
  <footer className="attribution">
    <div className="container">
      <small>
        Surf spots &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{' '}
        contributors, ODbL. Conditions from{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>, CC BY 4.0.
      </small>
    </div>
  </footer>
);

export default Attribution;
