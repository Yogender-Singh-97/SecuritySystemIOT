
module.exports = (sequelize, DataTypes) => {

    const patrol_params = sequelize.define("patrol_params",{
        lower_bound_time: { type: DataTypes.STRING,allowNull: false},
        upper_bound_time: { type: DataTypes.STRING,allowNull: false},
        expected_clock_time: { type: DataTypes.STRING,allowNull: false},
        patrol_params_id: { type: DataTypes.INTEGER, primaryKey: true , autoIncrement: true }
    }); 

    patrol_params.associate= (models)=>{  
      
      patrol_params.belongsTo(models.patrols, {
        foreignKey: {
          name: 'patrol_id'
         }, as: 'patrol', onDelete: 'CASCADE'
      });

      patrol_params.belongsTo(models.checkpoints, {
        foreignKey: {
          name: 'checkpoint_id'
         }, as: 'checkpoint', onDelete: 'CASCADE'
      });

      patrol_params.hasMany(models.guard_clocks, {
        foreignKey: {
          name: 'patrol_params_id'
        }, as: 'guard_clock',onDelete: 'CASCADE' });



    };
 
    return patrol_params;   

};
    
    
    
    