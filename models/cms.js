const db = require("../configuration/dbConn");
const common = require("../controllers/common");

module.exports = {
  emailSendLog: async (
    email_code,
    mailFrom,
    mailTo,
    fromType,
    toType,
    mailSubject,
    mailHtml,
    senddate,
    ccMail
  ) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO 
		tbl_email_logs(
		email_code,from_email,to_email,from_type,to_type,mail_subject,mail_content,mail_sent_date,status,cc_email
		) 
		VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) 
		RETURNING email_log_id`;
      db.one(sql, [
        email_code,
        mailFrom,
        mailTo,
        fromType,
        toType,
        mailSubject,
        mailHtml,
        senddate,
        1,
        ccMail,
      ])
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
};
