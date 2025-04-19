import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Project extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public status!: 'active' | 'completed' | 'on-hold';
  public startDate!: Date;
  public endDate?: Date;
  public clientId!: string;
}

Project.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'on-hold'),
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Project'
});

export default Project; 