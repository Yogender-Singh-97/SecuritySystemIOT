module.exports = (sequelize, DataTypes) => {

  const guard_allocations = sequelize.define("guard_allocations", {
    shift_start: { type: DataTypes.STRING, allowNull: false },
    shift_stop: { type: DataTypes.STRING, allowNull: false },
    week_start_day: { type: DataTypes.INTEGER, allowNull: false },
    week_stop_day: { type: DataTypes.INTEGER, allowNull: false },
    allocation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    allocation_status: { type: DataTypes.ENUM, values: ['active', 'inactive'], defaultValue: "active" }
  });

  guard_allocations.associate = (models) => {

    guard_allocations.belongsTo(models.patrols, {
      foreignKey: {
        name: 'patrol_id'
      }, as: 'patrol', 
      onDelete: 'CASCADE'
    });

    guard_allocations.belongsTo(models.users, {
      foreignKey: {
        name: 'user_id'
      }, as: 'guard', 
      onDelete: 'CASCADE'
    });
  };
  return guard_allocations;
};



