
module.exports = (sequelize, DataTypes) => {

    const checkpoints = sequelize.define("checkpoints",{
        checkpoint_name: { type: DataTypes.STRING,allowNull: false},
        checkpoint_gps: { type: DataTypes.STRING,allowNull: false},
        checkpoint_embeded_id: { type: DataTypes.INTEGER,allowNull: false},
        checkpoint_id: { type: DataTypes.INTEGER, primaryKey: true , autoIncrement: true }
    }); 

    checkpoints.associate= (models)=>{  
      
      checkpoints.belongsTo(models.location, {
        foreignKey: {
          name: 'location_id'
         }, as: 'loc', onDelete: 'CASCADE'
      });

      checkpoints.hasMany(models.patrol_params, {
        foreignKey: {
          name: 'checkpoint_id'
        }, as: 'patrol',onDelete: 'CASCADE' });

     
      checkpoints.hasMany(models.guard_clocks, {
          foreignKey: {
            name: 'checkpoint_id'
          }, as: 'guard_clock'}); 




    };
    
 
    return checkpoints;   

};
    
    
    
    