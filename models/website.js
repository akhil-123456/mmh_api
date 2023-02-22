const db = require("../configuration/dbConn");
const common = require("../controllers/common");

module.exports = {
  contact_us: async (name, email, description, number, created_at, status) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "insert into tbl_queries(name, email, phone_no, description, created_at,status) values( $1, $2,$3, $4, $5,$6) returning id",
        [name, email, number, description, created_at, status]
      )
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
  get_featured_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_featured_images where  status=1  order by id desc`
      )
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

  faq_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_faqs where  status =1 order by id DESC`)
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          console.log("err", err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },

  review_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_user_review where status =1 order by id DESC`)
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          console.log("err", err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  master_service: async () => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select *  from tbl_master_services where status=1 order by id ASC`
      )
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          console.log("err", err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  tc_pc_details: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_tc_pc WHERE id=$1 `, [id])
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          console.log("err", err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },

  get_partner_blog_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_partner_blog where  status=1  order by id desc`)
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
