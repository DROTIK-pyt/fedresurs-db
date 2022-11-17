const scheme = require('./scheme')

async function initScheme() {
  await scheme.sequelize.sync({force: true})
  console.log("")
  console.log("Scheme synced.")
}
initScheme()


module.exports = {
  
}