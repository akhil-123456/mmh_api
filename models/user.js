const db = require("../configuration/dbConn");
const common = require("../controllers/common");
//const moment = require("moment");

module.exports = {
  findByUserId: async (id) => {
    let condition = "";
    if (!!id) {
      condition += ` AND id=${id} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_users where status=1 ${condition}`)
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
  get_user_details: async (email, phone) => {
    let condition = "";
    if (!!email) {
      condition += ` AND LOWER(email)='${email.toLowerCase()}' `;
    }
    if (!!phone) {
      condition += ` AND phone=${phone} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select id,status ,name from tbl_users where 1=1 AND status !=2 ${condition}`
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
  get_user: async (phone) => {
    let condition = "";

    if (!!phone) {
      condition += ` AND phone=${phone} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_users where status=1  ${condition}`)
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
  create_user_email: async (name, password, email, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_users(name,password,email,created_at,status) VALUES($1,$2,$3,$4,$5) RETURNING id`;
      db.one(sql, [name, password, email, created_at, status])
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
  get_user_by_email: async (email) => {
    let condition = "";
    if (!!email) {
      condition += ` AND LOWER(email)='${email.toLowerCase()}' `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_users where status=1  ${condition}`)
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

  update_user_password: async (name, password, email, created_at, status) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_users SET password = ($1),updated_at = ($2) ,name=($3) ,status=($4)WHERE   LOWER(email)=($5) RETURNING id`,
        [password, created_at, name, status, email.toLowerCase()]
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

  reset_user_password: async (password, email, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_users SET password = ($1),updated_at = ($2) WHERE LOWER(email)=($3) RETURNING id`,
        [password, updated_at, email.toLowerCase()]
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
  check_user_number: async (phone) => {
    let condition = "";

    if (!!phone) {
      condition += ` AND phone=${phone} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_users where status!=2  ${condition}`)
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

  create_user_phone: async (name, phone, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_users(name,phone,created_at,status) VALUES($1,$2,$3,$4) RETURNING id`;
      db.one(sql, [name, phone, created_at, status])
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

  get_wishlist: async (
    user_id,
    search_txt,
    start_date,
    end_date,
    status,
    limit,
    offset
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND t.status='${status}' `;
    }
    if (!!user_id) {
      condition += ` AND t.user_id='${user_id}' `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(t.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(t.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT * FROM tbl_users_wishlist t LEFT JOIN  tbl_partner p  ON t.partner_id = p.id where  t.status=1 AND p.status=1   ${condition} order by t.partner_id DESC limit ${limit} offset ${offset}`
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
  wishlist_count: async (user_id, search_txt, start_date, end_date, status) => {
    var condition = "";

    if (!!status) {
      condition += ` AND t.status='${status}' `;
    }
    if (!!user_id) {
      condition += ` AND t.user_id='${user_id}' `;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(t.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(t.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        ` SELECT count(DISTINCT(t.partner_id)) as count FROM tbl_users_wishlist t  LEFT JOIN  tbl_partner p ON t.partner_id = p.id where  t.status=1 AND p.status=1 AND t.user_id=1   ${condition}`
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

  // book partner
  get_book_partner: async (
    user_id,
    search_txt,
    start_date,
    end_date,
    status,
    limit,
    offset
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND book.status='${status}' `;
    }
    if (!!user_id) {
      condition += ` AND book.user_id='${user_id}' `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(book.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(book.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `  select * from tbl_partner_booking book
        left join  tbl_partner  p
        on book.partner_id= p.id where book.status=1 and p.status=1  ${condition} order by book.partner_id DESC limit ${limit} offset ${offset}`
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

  book_partner_count: async (
    user_id,
    search_txt,
    start_date,
    end_date,
    status
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND book.status='${status}' `;
    }
    if (!!user_id) {
      condition += ` AND book.user_id='${user_id}' `;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(book.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(book.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT count(DISTINCT(book.partner_id)) as count FROM tbl_partner_booking book  LEFT JOIN 
        tbl_partner p ON book.partner_id = p.id where  book.status=1 AND p.status=1  ${condition}`
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
  partnerExistWishlist: async (partner_id, user_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_users_wishlist  where partner_id=$1 and user_id=$2 and status=1 `,
        [partner_id, user_id]
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
  add_wishlist: async (user_id, partner_id, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_users_wishlist(user_id,partner_id,created_at,status) VALUES($1,$2,$3,$4) RETURNING id`;
      db.one(sql, [user_id, partner_id, created_at, status])
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
  delete_wishlist: async (user_id, partner_id, updated_at) => {
    return new Promise(function (resolve, reject) {
      var sql = `UPDATE tbl_users_wishlist set status=0 , updated_at=($3) where user_id=$1 AND partner_id=$2 AND status=1   RETURNING id`;
      db.one(sql, [user_id, partner_id, updated_at])
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

  partnerExistBooking: async (partner_id, user_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_partner_booking  where partner_id=$1 and user_id=$2 and status=1 `,
        [partner_id, user_id]
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

  book_partner: async (user_id, partner_id, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_partner_booking(user_id,partner_id,created_at,status) VALUES($1,$2,$3,$4) RETURNING booking_id`;
      db.one(sql, [user_id, partner_id, created_at, status])
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
  cancel_booking: async (user_id, partner_id, updated_at) => {
    return new Promise(function (resolve, reject) {
      var sql = `UPDATE tbl_partner_booking set status=0 , updated_at=($3) where user_id=$1 AND partner_id=$2 AND status=1   RETURNING booking_id`;
      db.one(sql, [user_id, partner_id, updated_at])
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
