import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Task extends Model {
  public id!: string;
  public title!: string;
  public description?: string;
  public status!: 'draft' | 'in-progress' | 'under-review' | 'completed' | 'canceled';
  public dueDate?: Date;
  public projectId?: string;
  public clientId?: string;
  public createdBy!: string;
}

Task.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'in-progress', 'under-review', 'completed', 'canceled'),
    defaultValue: 'draft'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Task'
});

export default Task; 