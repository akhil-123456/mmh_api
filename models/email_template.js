const db = require("../configuration/dbConn");
const common = require("../controllers/common");

module.exports = {
  email_template: async (email_code) => {
    console.log("===>", email_code);
    return new Promise(function (resolve, reject) {
      db.any(`select * from  tbl_master_emails where email_code = ($1)`, [
        email_code,
      ])
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(err);
        });
    });
  },
};
