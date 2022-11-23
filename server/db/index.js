const scheme = require('./scheme')

async function initScheme() {
  await scheme.sequelize.sync({alter: false})
  console.log("")
  console.log("Scheme synced.")
}
initScheme()


module.exports = {
  
}