module.exports = (sequelize, DataTypes) => {

  const guard_clocks = sequelize.define("guard_clocks", {
    clock_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clocking_time: { type: DataTypes.DATE, allowNull: false },
    clocking_status: { type: DataTypes.ENUM, values: ['ok', 'miss', 'invalid'], defaultValue: "invalid" }
  });

  guard_clocks.associate = (models) => {

    guard_clocks.belongsTo(models.checkpoints, {
      foreignKey: {
        name: 'checkpoint_id'
      }, as: 'checkpoint'
    });

    guard_clocks.belongsTo(models.users, {
      foreignKey: {
        name: 'user_id'
      }, as: 'guard', 
      onDelete: 'CASCADE'
    });

    guard_clocks.belongsTo(models.patrols, {
      foreignKey: {
        name: 'patrol_id'
      }, as: 'patrol', 
      onDelete: 'CASCADE'
    });

    guard_clocks.belongsTo(models.patrol_params, {
      foreignKey: {
        name: 'patrol_params_id'
      }, as: 'patrol_param', 
      onDelete: 'CASCADE'
    });
  };
  return guard_clocks;
};



