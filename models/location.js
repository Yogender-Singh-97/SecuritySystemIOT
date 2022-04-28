module.exports = (sequelize, DataTypes) => {

  const location = sequelize.define("location", {
    location_name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    location_gps: { type: DataTypes.STRING, allowNull: false },
    location_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
  });

  location.associate = (models) => {

    location.hasMany(models.checkpoints, {
      foreignKey: {
        name: 'location_id'
      }, as: 'checkpoint', 
      onDelete: 'CASCADE'
    });
  };
  return location;
};



