
module.exports = (sequelize, DataTypes) => {

    const users = sequelize.define("users",{
      user_id: { type: DataTypes.INTEGER, primaryKey: true , autoIncrement: true },
      identification: { type: DataTypes.STRING,allowNull: false},
      grfid: { type: DataTypes.STRING,allowNull: true},
      firstname: { type: DataTypes.STRING,allowNull: false},
      lastname: { type: DataTypes.STRING,allowNull: false},
      email: { type: DataTypes.STRING,allowNull: false},
      phonenumber: { type: DataTypes.STRING,allowNull: false},
      username: { type: DataTypes.STRING,allowNull: false},
      password: { type: DataTypes.STRING,allowNull: false},
      status:{ type: DataTypes.ENUM,values: ['current', 'not_current'],defaultValue: "current"},  
      role:{ type: DataTypes.ENUM,values: ['admin', 'supervisor','guard'],defaultValue: "guard"}
    }); 

    
  
    users.associate= (models)=>
    {
    
        users.hasMany(models.guard_allocations, {
        foreignKey: {
          name: 'user_id'
        }, as: 'allocation',onDelete: 'CASCADE' }); 
  

        users.hasMany(models.guard_clocks, {
          foreignKey: {
            name: 'user_id'
          }, as: 'guard_clock' });  
                    
    }  
   
    
  
    return users;
   

};
    
    
    
    