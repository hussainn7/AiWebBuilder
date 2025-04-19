import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Client extends Model {
  public id!: string;
  public name!: string;
  public contactInfo?: string;
  public description?: string;
  public status!: 'active' | 'inactive';
}

Client.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactInfo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  sequelize,
  modelName: 'Client'
});

export default Client; 