module.exports = (sequelize, Sequelize) => {
    const Session = sequelize.define("session", {
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      is_public : {
        type: Sequelize.BOOLEAN
      }
    });
    return Session;
  };