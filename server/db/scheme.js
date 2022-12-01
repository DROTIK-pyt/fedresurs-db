const dbBaseSetting = require('../config/dbSettings.json')

const { Sequelize, DataTypes, Op } = require("sequelize")
const sequelize = new Sequelize(dbBaseSetting.dataBase, dbBaseSetting.user, dbBaseSetting.password, {
  dialect: "mysql",
  host: dbBaseSetting.host,
})

// Таблицы
const core = sequelize.define('core', {
  idCore: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  showInTable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  }
})

const theCore = sequelize.define('theCore', {
  idTheCore: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
})

const core2core = sequelize.define('core2core', {
  idCore2core: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  parentCoreId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  childCoreId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})

const typeOfField = sequelize.define('typeOfField', {
  idTypeOfField: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  showInColumnTable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  showInFilter: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
})

const coreTypeOfField = sequelize.define('coreTypeOfField', {
  value: {
    type: DataTypes.TEXT('LONG'),
    allowNull: false,
  }
})

// Связи
core.belongsToMany(theCore, {through: "coreHasTheCore"})
theCore.belongsToMany(core, {through: "coreHasTheCore"})

theCore.belongsToMany(typeOfField, {through: coreTypeOfField, uniqueKey: "coreTypeOfFieldUnique"})
typeOfField.belongsToMany(theCore, {through: coreTypeOfField, uniqueKey: "coreTypeOfFieldUnique"})
theCore.hasMany(coreTypeOfField)
coreTypeOfField.belongsTo(theCore)
typeOfField.hasMany(coreTypeOfField)
coreTypeOfField.belongsTo(typeOfField)

module.exports = {
  dbBaseSetting,
  DataTypes,
  sequelize,
  Op,
  core,
  theCore,
  core2core,
  typeOfField,
  coreTypeOfField,
}