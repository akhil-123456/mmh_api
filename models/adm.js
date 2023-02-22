const db = require("../configuration/dbConn");
const common = require("../controllers/common");
const moment = require("moment");

module.exports = {
  findByUsername: async (username) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "select id,password,first_name,last_name,admin_type from tbl_admin where username=($1) and status='1'",
        [username]
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
  get_admin: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "Select first_name,last_name,username,email,status,manager_id,admin_type from tbl_admin  where id=($1)",
        [id]
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
  get_sub_admin_exist: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "Select id from tbl_admin  where id=($1) and admin_type='SUB' and status!=2 ",
        [id]
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

  findByAdminId: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "select id,email,first_name,last_name from tbl_admin where id=($1) and status='1'",
        [id]
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
  usernameExists: async (username, admin_id) => {
    var condition = "";
    if (!!admin_id) {
      condition += ` AND id !=${admin_id}  `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_admin where username=($1) and status !=2 ${condition}`,
        [username]
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
  email_exists: async (email, admin_id) => {
    var condition = "";
    if (!!admin_id) {
      condition += ` AND id !=${admin_id}  `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_admin where email=($1) and status !=2 ${condition}`,
        [email]
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
  phoneExists: async (phone, admin_id) => {
    var condition = "";
    if (!!admin_id) {
      condition += ` AND id !=${admin_id}  `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_admin where phone=($1) and status !=2  ${condition} `,
        [phone]
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
  add_sub_admin: async (adm) => {
    return new Promise(function (resolve, reject) {
      db.one(
        "INSERT INTO tbl_admin(first_name,last_name,email,username,password,date_added,added_by,status,phone,admin_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
        [
          adm.first_name,
          adm.last_name,
          adm.email,
          adm.username,
          adm.password,
          adm.date_added,
          adm.added_by,
          adm.status,
          adm.phone,
          adm.admin_type,
        ]
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
  add_admin_permission: async (permissions, admin_id, created_at) => {
    return new Promise(function (resolve, reject) {
      db.one(
        "INSERT INTO tbl_admin_permission(admin_id,permissions,status,created_at) VALUES($1,$2,$3,$4) RETURNING id",
        [admin_id, permissions, 1, created_at]
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
  update_admin: async (adm, admin_id) => {
    return new Promise(function (resolve, reject) {
      db.result(
        "UPDATE tbl_admin set first_name=($1),last_name=($2),email=($3),username=($4),group_id=($5),status=($6),date_updated=($7),updated_by=($8),manager_id=($10) where id=($9)",
        [
          adm.first_name,
          adm.last_name,
          adm.email,
          adm.username,
          adm.group_id,
          adm.status,
          adm.date_updated,
          adm.updated_by,
          admin_id,
          adm.manager_id,
        ],
        (r) => r.rowCount
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
  update_self: async (adm) => {
    return new Promise(function (resolve, reject) {
      if (adm.password === undefined) {
        db.result(
          "UPDATE tbl_admin set first_name=($1),last_name=($2),email=($3),username=($4),group_id=($5),date_updated=($6),updated_by=($7) where id=($8)",
          [
            adm.first_name,
            adm.last_name,
            adm.email,
            adm.username,
            adm.group_id,
            adm.date_updated,
            adm.updated_by,
            adm.admin_id,
          ],
          (r) => r.rowCount
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      } else {
        db.result(
          "UPDATE tbl_admin set first_name=($1),last_name=($2),email=($3),username=($4),group_id=($5),date_updated=($6),updated_by=($7),password=($8) where id=($9)",
          [
            adm.first_name,
            adm.last_name,
            adm.email,
            adm.username,
            adm.group_id,
            adm.date_updated,
            adm.updated_by,
            adm.password,
            adm.admin_id,
          ],
          (r) => r.rowCount
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      }
    });
  },
  delete_admin: async (admin_id) => {
    return new Promise(function (resolve, reject) {
      db.result(
        "Update tbl_admin set status='2' where id=($1)",
        [admin_id],
        (r) => r.rowCount
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
  list_admin: async (
    id,
    limit,
    offset,
    first_name,
    last_name,
    email,
    group,
    status
  ) => {
    return new Promise(function (resolve, reject) {
      var condition = "";
      if (first_name != "") {
        condition += ` AND LOWER(tbl_admin.first_name) LIKE '%${first_name.toLowerCase()}%'`;
      }
      if (last_name != "") {
        condition += ` AND LOWER(tbl_admin.last_name) LIKE '%${last_name.toLowerCase()}%'`;
      }
      if (email != "") {
        condition += ` AND LOWER(tbl_admin.email) LIKE '%${email.toLowerCase()}%'`;
      }
      if (group != "") {
        condition += ` AND tbl_admin.group_id = ${group}`;
      }
      if (status != "") {
        condition += ` AND tbl_admin.status = ${status}`;
      }

      db.any(
        `select manager.first_name AS manager_first_name, manager.last_name AS manager_last_name, tbl_admin.manager_id, tbl_admin.id, tbl_admin.first_name, tbl_admin.last_name, tbl_admin.email, tbl_admin_group.group_id, tbl_admin_group.group_name,tbl_admin.status, tbl_admin. TO_CHAR(login_log.max_login_date,'dd/mm/yyyy HH12:MI AM') AS display_login_date from tbl_admin LEFT JOIN tbl_admin_group on tbl_admin.group_id = tbl_admin_group.group_id LEFT JOIN (
				SELECT 
					admin_id,
					MAX(login_date) AS max_login_date
				FROM tbl_admin_login_logs GROUP BY admin_id
			) AS login_log 
			ON tbl_admin.id = login_log.admin_id

			LEFT JOIN tbl_admin AS manager
			ON manager.id = tbl_admin.manager_id
			
			where tbl_admin.id !=($1) AND tbl_admin.status !=($2) ${condition} order by tbl_admin.id desc limit $3 offset $4`,
        [id, 2, limit, offset]
      )
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          //console.log(err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },

  list_admin_users: async (id = 0) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT tbl_admin.id AS id, CONCAT(tbl_admin.first_name , ' ' , tbl_admin.last_name) AS name FROM tbl_admin WHERE tbl_admin.id !=($1) AND tbl_admin.status !=($2)`,
        [id, 2]
      )
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          //console.log(err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  admin_download: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select tbl_admin.id, tbl_admin.first_name, tbl_admin.last_name, tbl_admin.email, tbl_admin_group.group_id, tbl_admin_group.group_name,tbl_admin.status, tbl_admin. TO_CHAR(login_log.max_login_date,'dd/mm/yyyy HH12:MI AM') AS display_login_date from tbl_admin LEFT JOIN tbl_admin_group on tbl_admin.group_id = tbl_admin_group.group_id LEFT JOIN (
				SELECT 
					admin_id,
					MAX(login_date) AS max_login_date
				FROM tbl_admin_login_logs GROUP BY admin_id
			) AS login_log 
			ON tbl_admin.id = login_log.admin_id where tbl_admin.id !=($1) AND tbl_admin.status !=($2) order by tbl_admin.id desc`,
        [id, 2]
      )
        .then(function (data) {
          resolve(data);
        })
        .catch(function (err) {
          //console.log(err);
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  count_all_admin: async (id, first_name, last_name, email, group, status) => {
    return new Promise(function (resolve, reject) {
      var condition = "";
      if (first_name != "") {
        condition += ` AND LOWER(tbl_admin.first_name) LIKE '%${first_name.toLowerCase()}%'`;
      }
      if (last_name != "") {
        condition += ` AND LOWER(tbl_admin.last_name) LIKE '%${last_name.toLowerCase()}%'`;
      }
      if (email != "") {
        condition += ` AND LOWER(tbl_admin.email) LIKE '%${email.toLowerCase()}%'`;
      }
      if (group != "") {
        condition += ` AND tbl_admin.group_id = ${group}`;
      }
      if (status != "") {
        condition += ` AND tbl_admin.status = ${status}`;
      }

      db.any(
        `Select count(tbl_admin.id) as cnt from tbl_admin LEFT JOIN tbl_admin_group on tbl_admin.group_id = tbl_admin_group.group_id where tbl_admin.id !=($1) AND tbl_admin.status !=($2) ${condition}`,
        [id, 2]
      )
        .then(function (data) {
          resolve(data[0].cnt);
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },

  login_log: async (login_attempt) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_admin_login_logs(admin_id,login_date,ip_address) VALUES($1,$2,$3) RETURNING log_id`;
      db.one(sql, [
        login_attempt.admin_id,
        login_attempt.login_date,
        login_attempt.ip_address,
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
  /**
   *
   * @returns
   */

  get_super_admin: async () => {
    return new Promise(function (resolve, reject) {
      db.any(
        "Select id,first_name,last_name,username,email from tbl_admin where super_admin = 1 AND status = 1 ORDER BY id ASC"
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
  /**
   *
   * @param {*} requser
   * @param {*} start_date
   * @param {*} end_date
   * @param {*} limit
   * @param {*} offset
   * @param {*} status_id
   * @param {*} query_arr
   * @param {*} new_type
   * @returns
   */

  contact_us: async (
    search_txt,
    start_date,
    end_date,
    limit,
    offset,
    status
  ) => {
    var condition = "";
    if (start_date != "") {
      condition += ` AND DATE(created_at) >= '${start_date}'::date`;
    }

    if (end_date != "") {
      condition += ` AND DATE(created_at) <= '${end_date}'::date`;
    }
    if (!!status) {
      condition += ` AND status='${status}'`;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(name::varchar) LIKE '%${search_txt}%' OR LOWER(email::varchar) LIKE '%${search_txt}%' OR phone_no::varchar LIKE '%${search_txt}%' OR LOWER(description::varchar) LIKE '%${search_txt}%')`;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_queries where 1=1 ${condition} AND status !=2 order by tbl_queries.id DESC  limit ${limit} offset ${offset} `
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
  contact_us_count: async (search_txt, start_date, end_date, status) => {
    var condition = "";
    if (start_date != "") {
      condition += ` AND DATE(created_at) >= '${start_date}'::date`;
    }

    if (end_date != "") {
      condition += ` AND DATE(created_at) <= '${end_date}'::date`;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(name::varchar) LIKE '%${search_txt}%' OR LOWER(email::varchar) LIKE '%${search_txt}%' OR phone_no::varchar LIKE '%${search_txt}%' OR LOWER(description::varchar) LIKE '%${search_txt}%')`;
    }
    if (!!status) {
      condition += ` AND status='${status}'`;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select count(DISTINCT(id)) as count
			    from tbl_queries  where 1=1 AND status !=2 ${condition}`
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

  delete_contact_us: async (contact_id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_queries SET status = 2,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [contact_id, updated_at]
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

  reply_query: async (contact_id, reply_message, updated_at, admin_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_queries SET status = 0, replied_msg=$2,updated_at = $3,replied_by=$4 WHERE id= $1 RETURNING id`,
        [contact_id, reply_message, updated_at, admin_id]
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

  contact_id_exists: async (contact_id) => {
    return new Promise(function (resolve, reject) {
      db.any("select * from tbl_queries where id=($1) and status !=2", [
        contact_id,
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
  tc_pc_id_exists: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any("select * from tbl_tc_pc where id=($1) ", [id])
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

  create_featured_image: async (
    title,
    original_name,
    new_name,
    created_at,
    status
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "insert into tbl_featured_images( title,original_name,new_name,created_at,status) values( $1, $2,$3,$4,$5 ) returning id",
        [title, original_name, new_name, created_at, status]
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

  get_featured_list: async (status) => {
    var condition = "";
    if (status != "") {
      condition += ` AND status=${status} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_featured_images where 1=1 AND status!=2 ${condition} order by id desc`
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

  delete_featured_image: async (id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_featured_images SET status = 2,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at]
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
  change_status_featured_image: async (id, status, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_featured_images SET status = $3,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at, status]
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

  create_faq: async (title, description, status, created_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "insert into tbl_faqs( title,description,status,created_at) values( $1, $2,$3,$4 ) returning id",
        [title, description, status, created_at]
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
  faq_list: async (search_txt, status) => {
    var condition = "";

    if (!!status) {
      condition += ` AND status='${status}'`;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(title::varchar) LIKE '%${search_txt}%' OR LOWER(description::varchar) LIKE '%${search_txt}%')`;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_faqs where 1=1 ${condition} AND status !=2 order by id DESC`
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

  update_faq: async (title, description, status, updated_at, id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_faqs SET title = $1, description=$2, status=$3, updated_at = $4 WHERE   id= $5 RETURNING id`,
        [title, description, status, updated_at, id]
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
  change_status_faq: async (id, status, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_faqs SET status = $3,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at, status]
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
  delete_faq: async (id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_faqs SET status = 2,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at]
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

  create_user_feedback: async (
    name,
    designation,
    review,
    original_name,
    new_name,
    created_at,
    status
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `insert into tbl_user_review( name,designation,review,original_name,new_name,created_at,status) values( $1, $2,$3,$4,$5,$6,$7 ) returning id`,
        [name, designation, review, original_name, new_name, created_at, status]
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
  review_list: async (search_txt, status) => {
    var condition = "";

    if (!!status) {
      condition += ` AND status='${status}'`;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(name::varchar) LIKE '%${search_txt}%' OR LOWER(designation::varchar) LIKE '%${search_txt}%' OR LOWER(review::varchar) LIKE '%${search_txt}%') `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_user_review where 1=1 ${condition} AND status !=2 order by id DESC`
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
  change_status_review: async (id, status, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_user_review SET status = $3,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at, status]
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
  delete_user_feedback: async (id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_user_review SET status = 2,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at]
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
  update_user_feedback: async (obj, id) => {
    return new Promise(function (resolve, reject) {
      if (obj.new_name && obj.new_name != "") {
        db.any(
          "UPDATE tbl_user_review SET name=($1),designation=($2),review=($3),status=($4),updated_at=($5), original_name=($6) ,new_name=($7) where id=($8)",
          [
            obj.name,
            obj.designation,
            obj.review,
            obj.status,
            obj.updated_at,
            obj.originalname,
            obj.new_name,
            id,
          ]
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      } else {
        db.any(
          "UPDATE tbl_user_review SET name=($1),designation=($2),review=($3),status=($4),updated_at=($5) where id=($6)",
          [
            obj.name,
            obj.designation,
            obj.review,
            obj.status,
            obj.updated_at,
            id,
          ]
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      }
    });
  },
  user_list: async (
    search_txt,
    status,
    start_date,
    end_date,
    limit,
    offset
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND status='${status}' `;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(name::varchar) LIKE '%${search_txt}%' OR LOWER(email::varchar) LIKE '%${search_txt}%' OR LOWER(phone::varchar) LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_users where 1=1 ${condition} AND status !=2 order by id DESC limit $1 offset $2 `,
        [limit, offset]
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
  count_users: async (search_txt, status, start_date, end_date) => {
    var condition = "";
    if (start_date != "") {
      condition += ` AND DATE(created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(created_at) <= '${end_date}'::date `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(name::varchar) LIKE '%${search_txt}%' OR LOWER(email::varchar) LIKE '%${search_txt}%' OR LOWER(phone::varchar) LIKE '%${search_txt}%' ) `;
    }
    if (!!status) {
      condition += ` AND status='${status}' `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select count(DISTINCT(id)) as count
			    from tbl_users  where 1=1 AND status !=2 ${condition}`
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
  delete_user: async (id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_users SET status = 2,updated_at = $2 WHERE   id= $1 RETURNING id`,
        [id, updated_at]
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
  check_user_exist: async (user_id) => {
    return new Promise(function (resolve, reject) {
      db.any("select * from tbl_users where id=($1) and status !=2", [user_id])
        .then(function (data) {
          if (data.length > 0) resolve({ success: true });
          else resolve({ success: false });
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },

  check_user_email_exist: async (email, user_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "select * from tbl_users where email=($1) and status !=2 and id !=($2)",
        [email, user_id]
      )
        .then(function (data) {
          if (data.length > 0) resolve({ success: true });
          else resolve({ success: false });
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  check_user_phone_exist: async (phone, user_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "select * from tbl_users where phone=($1) and status !=2 and id !=($2)",
        [phone, user_id]
      )
        .then(function (data) {
          if (data.length > 0) resolve({ success: true });
          else resolve({ success: false });
        })
        .catch(function (err) {
          var errorText = common.getErrorText(err);
          var error = new Error(errorText);
          reject(error);
        });
    });
  },
  // price
  price_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_price where  status=1 order by id DESC`)
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
  update_price: async (price_monthly, price_yearly, updated_at, id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_price SET price_monthly = $1, price_yearly=$2, updated_at = $3 WHERE id=$4 RETURNING id`,
        [price_monthly, price_yearly, updated_at, id]
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

  //
  get_tc_pp_list: async () => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_tc_pc order by id desc`)
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
  tc_pc_details: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_tc_pc WHERE id= $1 `, [id])
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
  update_tc_pp: async (obj, id) => {
    return new Promise(function (resolve, reject) {
      if (obj.new_name && obj.new_name != "") {
        db.any(
          "UPDATE tbl_tc_pc SET title=($1),description=($2),updated_at=($3) ,orignal_name=($4) ,new_name=($5) where id=($6)",
          [
            obj.title,
            obj.description,
            obj.updated_at,
            obj.orignal_name,
            obj.new_name,
            id,
          ]
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      } else {
        db.any(
          "UPDATE tbl_tc_pc SET title=($1),description=($2),updated_at=($3) where id=($4)",
          [obj.title, obj.description, obj.updated_at, id]
        )
          .then(function (data) {
            resolve(data);
          })
          .catch(function (err) {
            var errorText = common.getErrorText(err);
            var error = new Error(errorText);
            reject(error);
          });
      }
    });
  },

  get_sub_admin: async (
    search_txt,
    status,
    start_date,
    end_date,
    limit,
    offset
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND tbl_admin.status='${status}' `;
    }

    if (!!search_txt) {
      condition += ` AND (LOWER(username::varchar) LIKE '%${search_txt}%' OR LOWER(first_name::varchar) LIKE '%${search_txt}%' OR LOWER(last_name::varchar) LIKE '%${search_txt}%'OR LOWER(email::varchar) LIKE '%${search_txt}%' OR LOWER(phone::varchar) LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(tbl_admin.date_added) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(tbl_admin.date_added) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select tbl_admin.username, tbl_admin.id as admin_id, first_name,last_name,email,tbl_admin.date_added as created_date,tbl_admin.status as status,phone,  tbl_admin_permission.permissions from tbl_admin 
        LEFT JOIN tbl_admin_permission on tbl_admin.id = tbl_admin_permission.admin_id
        where 1=1 ${condition} AND tbl_admin.status !=2 AND admin_type='SUB' order by tbl_admin.id DESC limit $1 offset $2 `,
        [limit, offset]
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
  count_sub_admin: async (search_txt, status, start_date, end_date) => {
    var condition = "";
    if (start_date != "") {
      condition += ` AND DATE(date_added) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(date_added) <= '${end_date}'::date `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(username::varchar) LIKE '%${search_txt}%' OR LOWER(first_name::varchar) LIKE '%${search_txt}%' OR LOWER(last_name::varchar) LIKE '%${search_txt}%'OR LOWER(email::varchar) LIKE '%${search_txt}%' OR LOWER(phone::varchar) LIKE '%${search_txt}%' ) `;
    }
    if (!!status) {
      condition += ` AND status='${status}' `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select count(DISTINCT(id)) as count
			    from tbl_admin  where 1=1 AND status !=2 AND admin_type='SUB' ${condition} `
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

  update_sub_admin: async (adm, id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "UPDATE tbl_admin SET first_name=($1),last_name=($2),email=($3),username=($4),date_updated=($5),updated_by=($6),status=($7),phone=($8)  where id=($9)",
        [
          adm.first_name,
          adm.last_name,
          adm.email,
          adm.username,
          adm.updated_at,
          adm.updated_by,
          adm.status,
          adm.phone,
          id,
        ]
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
  update_sub_admin_permission: async (
    permissions,
    admin_id,
    status,
    updated_at
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        "UPDATE tbl_admin_permission SET permissions=($2),updated_at=($3),status=($4) where admin_id=($1)",
        [admin_id, permissions, updated_at, status]
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
  delete_sub_admin: async (admin_id, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any("UPDATE tbl_admin SET status=2 ,date_updated=($2) where id=($1)", [
        admin_id,
        updated_at,
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
  change_status_sub_admin: async (id, status, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_admin SET status = $3,date_updated = $2 WHERE id= $1 RETURNING id`,
        [id, updated_at, status]
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
};
