
module.exports = (sequelize, DataTypes) => {

    const patrols = sequelize.define("patrols",{
        patrol_name: { type: DataTypes.STRING,allowNull: false},
        Patrol_description: { type: DataTypes.STRING,allowNull: false},
        checkpoint_threshod: { type: DataTypes.INTEGER },
        status:{ type: DataTypes.ENUM,values: ['Active', 'In_Active'],defaultValue: "Active"},  
        patrol_id: { type: DataTypes.INTEGER, primaryKey: true , autoIncrement: true }
    }); 

    patrols.associate= (models)=>{  
      
      patrols.hasMany(models.patrol_params, {
        foreignKey: {
          name: 'patrol_id'
         }, as: 'patrol_param', onDelete: 'CASCADE'
      });
   
      patrols.hasMany(models.guard_allocations, {
        foreignKey: {
          name: 'patrol_id'
        }, as: 'allocation',onDelete: 'CASCADE' }); 

      patrols.hasMany(models.guard_clocks, {
          foreignKey: {
            name: 'patrol_id'
          }, as: 'guard_clock',onDelete: 'CASCADE' }); 


    };
 
    return patrols;   

};
    
    
    
    