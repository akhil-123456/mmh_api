const db = require("../configuration/dbConn");
const common = require("../controllers/common");

module.exports = {
  create_otp: async (phone, otp, created_at, user_type, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_otp(phone_no,otp,user_type,status,created_at) VALUES($1,$2,$3,$4,$5) RETURNING id`;
      db.one(sql, [phone, otp, user_type, status, created_at])
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

  validate_otp: async (phone, user_type) => {
    return new Promise(function (resolve, reject) {
      var sql = `Select * from tbl_otp where phone_no=($1)  AND user_type=($2)  order by id desc limit 1`;
      db.any(sql, [phone, user_type])
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
  expire_otp: async (id, current_time) => {
    return new Promise(function (resolve, reject) {
      var sql =
        "UPDATE tbl_otp set status=0,updated_at=($2) where id=($1) returning id";
      db.one(sql, [id, current_time])
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
  create_email_token: async (email, token, user_type, created_at) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_token(email,token,user_type,created_at,status) VALUES($1,$2,$3,$4,$5) RETURNING id`;
      db.one(sql, [email, token, user_type, created_at, 1])
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
  findByUserEmail: async (email, user_type) => {
    return new Promise(function (resolve, reject) {
      var sql = `Select * from tbl_token where LOWER(email)=($1) AND user_type=($2) AND status=1  order by id desc limit 1`;
      db.any(sql, [email.toLowerCase(), user_type])
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
  update_email_token: async (email, updated_at, token, user_type) => {
    return new Promise(function (resolve, reject) {
      var sql =
        "UPDATE tbl_token set status=0,updated_at=($2) where LOWER(email)=($1) and token=($3) and  user_type=($4) returning id";
      db.one(sql, [email.toLowerCase(), updated_at, token, user_type])
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
  update_otp: async (phone, otp, updated_at, user_type) => {
    return new Promise(function (resolve, reject) {
      var sql =
        "UPDATE tbl_otp set otp_verified='YES',updated_at=($3) where phone_no=($1) and otp=($2)  and user_type=($4) returning id";
      db.one(sql, [phone, otp, updated_at, user_type])
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
  check_otp: async (phone, otp, user_type) => {
    return new Promise(function (resolve, reject) {
      var sql = `Select * from tbl_otp where phone_no=($1) AND user_type=($2) AND otp=($3) AND otp_verified='YES'  `;
      db.any(sql, [phone, user_type, otp])
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
  getPartnerDetails: async (partner_id) => {
    return new Promise(function (resolve, reject) {
      var sql = `Select name,email from tbl_partner where id=($1) `;
      db.any(sql, [partner_id])
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
