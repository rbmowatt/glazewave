'use strict';

/*
 * MEDIUMINT UNSIGNED tops out at 16,777,215 and the committed manifest already
 * exceeds it: across all three ranks the largest distance_m is 18,470,611 and
 * two images are over the ceiling, with thirteen more inside 10% of it. Rank 1
 * alone peaks at 16,708,549 and fits, which is why the first load never hit
 * this.
 *
 * MySQL out of strict mode clamps rather than erroring, so the failure mode is
 * a silently wrong distance on the rows that most need to be found and
 * removed - the commons-text tier does not filter on distance at all, and an
 * 18,470km match is a photo of the wrong hemisphere.
 *
 * INT UNSIGNED reaches 4,294,967,295. Half the earth's circumference is about
 * 20,037,500m, so no pair of points can ever overflow it.
 */
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.changeColumn(
    'spot_images',
    'distance_m',
    { type: Sequelize.INTEGER.UNSIGNED }
  ),

  down: (queryInterface, Sequelize) => queryInterface.changeColumn(
    'spot_images',
    'distance_m',
    { type: Sequelize.MEDIUMINT.UNSIGNED }
  ),
};
