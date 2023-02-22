const db = require("../configuration/dbConn");
const common = require("../controllers/common");
//const moment = require("moment");

module.exports = {
  findByPartnerId: async (id) => {
    let condition = "";
    if (!!id) {
      condition += ` AND id=${id} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_partner where status=1 ${condition}`)
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
  partnerExist: async (email, phone) => {
    var condition = "";
    if (!!email) {
      condition += ` AND LOWER(email)='${email.toLowerCase()}' `;
    }
    if (!!phone) {
      condition += ` AND phone='${phone}' `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select id from tbl_partner where 1=1 ${condition} AND status !=2`)
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
  get_partner_details: async (email, phone) => {
    let condition = "";
    if (!!email) {
      condition += ` AND LOWER(email)='${email.toLowerCase()}' `;
    }
    if (!!phone) {
      condition += ` AND phone=${phone} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `select id,status,name from tbl_partner where 1=1 AND status !=2 ${condition}`
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
  get_partner: async (phone) => {
    let condition = "";

    if (!!phone) {
      condition += ` AND phone=${phone} `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_partner where status=1  ${condition}`)
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
  get_partner_by_email: async (email) => {
    let condition = "";
    if (!!email) {
      condition += ` AND LOWER(email)='${email.toLowerCase()}' `;
    }
    return new Promise(function (resolve, reject) {
      db.any(`select * from tbl_partner where status=1  ${condition}`)
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
  update_partner_password: async (
    name,
    password,
    email,
    created_at,
    status
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_partner SET password = ($1),updated_at = ($2) ,name=($3) ,status=($4)WHERE   LOWER(email)=($5) RETURNING id`,
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
  create_partner_email: async (name, password, email, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_partner(name,password,email,created_at,status) VALUES($1,$2,$3,$4,$5) RETURNING id`;
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

  create_partner_phone: async (name, phone, created_at, status) => {
    return new Promise(function (resolve, reject) {
      var sql = `INSERT INTO tbl_partner(name,phone,created_at,status) VALUES($1,$2,$3,$4) RETURNING id`;
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

  get_partner_details_with_id: async (partner_id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT *
          FROM tbl_partner t
          LEFT JOIN tbl_partner_service p
            ON t.id = p.partner_id
            where  t.status= 1 and p.id IS NOT NULL and p.status=1 and t.id=${partner_id} `
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

  create_partner: async (
    originalname,
    firm_logo_new,
    status,
    firm_name,
    firm_city,
    work_email,
    website,
    team_strength,
    year_industry,
    projects_delivered,
    no_of_offices,
    fees_range_min,
    fees_range_max,
    description,
    liknedin_website,
    instagram_website,
    youtube_website,
    pinterest_website,
    paid_type,
    created_at,
    id
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_partner SET originalname=$1, firm_logo_new=$2, status=$3, firm_name=$4, firm_city=$5, work_email=$6, website=$7, team_strength=$8, year_industry=$9,projects_delivered=$10,no_of_offices=$11, fees_range_min=$12, fees_range_max=$13, description=$14,liknedin_website=$15, instagram_website=$16,youtube_website=$17, pinterest_website=$18, paid_type=$19,created_at=$20  WHERE   id= $21 RETURNING id`,
        // "insert into  tbl_partner ( originalname,firm_logo_new,status,firm_name,firm_city, work_email, website, team_strength, year_industry, projects_delivered,no_of_offices,fees_range_min, fees_range_max,description,liknedin_website,instagram_website,youtube_website,pinterest_website, paid_type,created_at) values( $1, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) returning id",
        [
          originalname,
          firm_logo_new,
          status,
          firm_name,
          firm_city,
          work_email,
          website,
          team_strength,
          year_industry,
          projects_delivered,
          no_of_offices,
          fees_range_min,
          fees_range_max,
          description,
          liknedin_website,
          instagram_website,
          youtube_website,
          pinterest_website,
          paid_type,
          created_at,
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

  get_bookings: async (
    partner_id,
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
    if (!!partner_id) {
      condition += ` AND book.partner_id='${partner_id}' `;
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
        `SELECT book.booking_id, book.user_id, book.partner_id,book.status, book.created_at, book.updated_at, users.name as user_name, users.email as user_email, users.phone as user_phone
          FROM tbl_partner_booking book
          LEFT JOIN tbl_users users ON book.user_id = users.id
          where  book.status= 1 and users.status =1 ${condition} order by book.booking_id DESC limit ${limit} offset ${offset} `
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
  bookings_count: async (
    partner_id,
    search_txt,
    start_date,
    end_date,
    status
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND book.status='${status}' `;
    }
    if (!!partner_id) {
      condition += ` AND book.partner_id='${partner_id}' `;
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
        `SELECT count(DISTINCT(book.booking_id)) as count
          FROM tbl_partner_booking book
          LEFT JOIN tbl_users users ON book.user_id = users.id
          where  book.status= 1 and users.status =1 ${condition}  `
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

  get_user_queries: async (
    partner_id,
    search_txt,
    start_date,
    end_date,
    status,
    limit,
    offset
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND queries.status='${status}' `;
    }
    if (!!partner_id) {
      condition += ` AND queries.partner_id='${partner_id}' `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(queries.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(queries.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT queries.query_id, queries.user_id, queries.partner_id,queries.status, queries.created_at, queries.updated_at, users.name as user_name, users.email as user_email, users.phone as user_phone
          FROM tbl_user_partner_queries queries
          LEFT JOIN tbl_users users ON queries.user_id = users.id
          where  queries.status= 1 and users.status =1 ${condition} order by queries.query_id DESC limit ${limit} offset ${offset} `
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
  user_queries_count: async (
    partner_id,
    search_txt,
    start_date,
    end_date,
    status
  ) => {
    var condition = "";

    if (!!status) {
      condition += ` AND queries.status='${status}' `;
    }
    if (!!partner_id) {
      condition += ` AND queries.partner_id='${partner_id}' `;
    }
    if (!!search_txt) {
      condition += ` AND (LOWER(users.name::varchar) LIKE '%${search_txt}%' OR LOWER(users.email::varchar) LIKE '%${search_txt}%' OR users.phone::varchar LIKE '%${search_txt}%' ) `;
    }
    if (start_date != "") {
      condition += ` AND DATE(queries.created_at) >= '${start_date}'::date `;
    }

    if (end_date != "") {
      condition += ` AND DATE(queries.created_at) <= '${end_date}'::date `;
    }
    return new Promise(function (resolve, reject) {
      db.any(
        `SELECT count(DISTINCT(queries.query_id)) as count
          FROM tbl_user_partner_queries queries
          LEFT JOIN tbl_users users ON queries.user_id = users.id
          where  queries.status= 1 and users.status =1 ${condition}  `
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

  create_partner_blog: async (
    originalname,
    new_name,
    title,
    description,
    link,
    status,
    created_at,
    partner_id
  ) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `insert into tbl_partner_blog(originalname,new_name,title,description,link,status,created_at,partner_id) values( $1, $2,$3,$4,$5,$6,$7,$8) returning id`,
        [
          originalname,
          new_name,
          title,
          description,
          link,
          status,
          created_at,
          partner_id,
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

  get_partner_blog: async (id) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `select * from tbl_partner_blog where status=1 and partner_id=$1 order by id DESC`,
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

  reset_partner_password: async (password, email, updated_at) => {
    return new Promise(function (resolve, reject) {
      db.any(
        `UPDATE  tbl_partner SET password = ($1),updated_at = ($2) WHERE LOWER(email)=($3) RETURNING id`,
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
};
