const dbBaseSetting = require('../config/dbSettings.json')

const { Sequelize, DataTypes, Op } = require("sequelize")
const sequelize = new Sequelize(dbBaseSetting.dataBase, dbBaseSetting.user, dbBaseSetting.password, {
  dialect: "mysql",
  host: dbBaseSetting.host,
})

// Таблицы
const company = sequelize.define('company', {
  idCompany: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  }
})

const event = sequelize.define('event', {
  idEvent: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  eventInfo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
})

const status = sequelize.define('status', {
  idStatus: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
})

const contactPerson = sequelize.define('contactPerson', {
  idContactPerson: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  fio: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requisits: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  otherInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
})

const historyPublic = sequelize.define('historyPublic', {
  idHistoryPublic: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  publication: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
})

const fieldsInfoOfCompany = sequelize.define('infoOfCompany', {
  idInfo: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  tag: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
})

const fieldsCompany = sequelize.define('fieldsCompany', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  }
})

// Связи
company.hasMany(event)
event.belongsTo(company)

status.belongsToMany(company, {through: "statusCompany"})
company.belongsToMany(status, {through: "statusCompany"})

status.belongsToMany(event, {through: "statusEvent"})
event.belongsToMany(status, {through: "statusEvent"})

contactPerson.belongsToMany(company, {through: "contactCompany"})
company.belongsToMany(contactPerson, {through: "contactCompany"})

historyPublic.belongsToMany(company, {through: "historyCompany"})
company.belongsToMany(historyPublic, {through: "historyCompany"})

company.belongsToMany(fieldsInfoOfCompany, {through: fieldsCompany})
fieldsInfoOfCompany.belongsToMany(company, {through: fieldsCompany})

module.exports = {
  dbBaseSetting,
  DataTypes,
  sequelize,
  Op,
  company,
  fieldsInfoOfCompany,
  historyPublic,
  contactPerson,
  status,
  event,
  fieldsCompany,
}