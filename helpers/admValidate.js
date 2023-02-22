const Joi = require("joi");
const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const path = require("path");
const admModel = require("../models/adm");
const common = require("../controllers/common");
const Config = require("../configuration/config");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();

var moment = require("moment");
const { uuid } = require("uuidv4");

const s3Config = new AWS.S3({
  accessKeyId: Config.aws.accessKeyId,
  secretAccessKey: Config.aws.secretAccessKey,
  Bucket: Config.aws.bucketName,
});

var multerS3ConfigClient = multerS3({
  s3: s3Config,
  bucket: Config.aws.bucketName,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
    });
  },
  key: function (req, file, cb) {
    var extention = path.extname(file.originalname);
    var new_file_name =
      "uploads/featured_image/" +
      Math.floor(Date.now() / 1000) +
      "-" +
      uuid() +
      extention;
    cb(null, new_file_name);
  },
});

var multerS3ConfigClient = multerS3({
  s3: s3Config,
  bucket: Config.aws.bucketName,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
    });
  },
  key: function (req, file, cb) {
    var extention = path.extname(file.originalname);
    var new_file_name =
      "uploads/banner_image/" +
      Math.floor(Date.now() / 1000) +
      "-" +
      uuid() +
      extention;
    cb(null, new_file_name);
  },
});

var multerS3ConfigClientReviewImage = multerS3({
  s3: s3Config,
  bucket: Config.aws.bucketName,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
    });
  },
  key: function (req, file, cb) {
    var extention = path.extname(file.originalname);
    var new_file_name =
      "uploads/review_image/" +
      Math.floor(Date.now() / 1000) +
      "-" +
      uuid() +
      extention;
    cb(null, new_file_name);
  },
});

var storage_banner_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

var storage_product_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/product_image"));
  },
  filename: function (req, file, callback) {
    // var extention = path.extname(file.originalname);
    // var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, file.originalname);
  },
});

var storage_featured_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/featured_image"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

var storage_review_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/review_image"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

var storage_banner_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/banner_image"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

var validatingImage = (schema) => {
  return (req, res, next) => {
    const result = Joi.validate(req.body, schema, {
      abortEarly: false,
    });
    if (result.error) {
      let err_msg = {};
      for (let counter in result.error.details) {
        let k = result.error.details[counter].context.key;
        let val = result.error.details[counter].message;
        err_msg[k] = val;
      }
      let return_err = { status: 2, errors: err_msg };
      return res.status(400).json(return_err);
    }

    if (!req.value) {
      req.value = {};
    }
    req.value["body"] = result.value;
    return true;
  };
};
module.exports = {
  validateBody: (schema) => {
    return (req, res, next) => {
      const result = Joi.validate(req.body, schema, { abortEarly: false });
      if (result.error) {
        let err_msg = {};
        for (let counter in result.error.details) {
          let k = result.error.details[counter].context.key;
          let val = result.error.details[counter].message;
          err_msg[k] = val;
        }
        let return_err = { status: 2, errors: err_msg };
        return res.status(400).json(return_err);
      }

      if (!req.value) {
        req.value = {};
      }
      req.value["body"] = result.value;
      next();
    };
  },
  validateParam: (schema) => {
    return (req, res, next) => {
      const result = Joi.validate(req.params, schema);
      if (result.error) {
        let return_err = { status: 2, errors: "Invalid argument" };
        return res.status(400).json(return_err);
      }

      if (!req.value) {
        req.value = {};
      }
      req.value["params"] = result.value;
      next();
    };
  },
  schemas: {
    record_id: Joi.object().keys({
      id: Joi.number().required(),
    }),

    authSchema: Joi.object().keys({
      username: Joi.string().required().alphanum().min(4).max(12),
      password: Joi.string().required().min(4).max(12),
    }),
    passSchema: Joi.object().keys({
      ex_password: Joi.string().required().min(4).max(12),
      new_password: Joi.string().required().min(4).max(12),
    }),

    reply_query: Joi.object().keys({
      email: Joi.string().email().required(),
      reply_message: Joi.string().required(),
    }),

    add_admin: Joi.object().keys({
      username: Joi.string().required().alphanum().min(4).max(12),
      password: Joi.string().required().min(8).max(12),
      email: Joi.string().required().email().max(200),
      first_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      last_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      group_id: Joi.number().required(),
      manager_id: Joi.number().required(),
      status: Joi.string()
        .required()
        .regex(/^[0|1]$/, "status posted"),
    }),
    create_employee: Joi.object().keys({
      emp_code: Joi.string()
        .required()
        .max(999999)
        .regex(/^[0-9]*$/, "Please send Employee Code in Number"),
      email: Joi.string().required().email().max(200),
      emp_name: Joi.string().required().min(3).max(500),
      plant: Joi.required(),
      hq_id: Joi.required(),
      div_id: Joi.required(),
    }),
    create_employee_update: Joi.object().keys({
      emp_code: Joi.string()
        .required()
        .max(999999)
        .regex(/^[0-9]*$/, "Please send Employee Code in Number"),
      email: Joi.string().required().email().max(200),
      emp_name: Joi.string().required().min(3).max(500),
      plant: Joi.required(),
      hq_id: Joi.required(),
      div_id: Joi.required(),
    }),
    update_admin: Joi.object().keys({
      username: Joi.string().required().alphanum().min(4).max(12),
      email: Joi.string().required().email().max(80),
      first_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      last_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      group_id: Joi.number().required(),
      manager_id: Joi.number().required(),
      status: Joi.string()
        .required()
        .regex(/^[0|1]$/, "status posted"),
    }),
    update_self: Joi.object().keys({
      username: Joi.string().required().alphanum().min(4).max(12),
      password: Joi.string().optional().min(4).max(12),
      email: Joi.string().required().email().max(200),
      first_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      last_name: Joi.string()
        .required()
        .min(1)
        .regex(/^[A-Za-z0-9]*$/, "Only alphanumeric value allowed")
        .max(30),
      group_id: Joi.number().required(),
    }),
    update_admin_p: Joi.object().keys({
      id: Joi.number().required(),
    }),
    delete_admin: Joi.object().keys({
      id: Joi.number().required(),
    }),
    get_admin: Joi.object().keys({
      id: Joi.number().required(),
    }),

    contact_reply_id: Joi.object().keys({
      contact_id: Joi.number().required(),
    }),

    change_status: Joi.object().keys({
      status: Joi.string()
        .required()
        .regex(/^[0|1]$/, "Please send proper status"),
    }),

    featured_image: Joi.object().keys({
      file: Joi.required(),
      title: Joi.string().required(),
      status: Joi.number().required(),
    }),
    review_image: Joi.object().keys({
      file: Joi.required(),
      name: Joi.string().required(),
      designation: Joi.string().required(),
      review: Joi.string().required(),
      status: Joi.number().required(),
    }),
    banner_image: Joi.object().keys({
      file: Joi.required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
    }),

    price: Joi.object().keys({
      price_monthly: Joi.number().required().min(1),

      price_yearly: Joi.number().required().min(1),
    }),
    faq: Joi.object().keys({
      title: Joi.string().required(),
      description: Joi.string().required(),
      status: Joi.number().required(),
    }),
    sub_admin: Joi.object().keys({
      username: Joi.string().required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .required()
        .regex(/^[0-9]{10}$/, `Phone number must have 10 digits.`),
      permissions: Joi.object({
        mng_users: Joi.boolean().required(),
        mng_partners: Joi.boolean().required(),
        mng_user_queries: Joi.boolean().required(),
        mng_featured_list: Joi.boolean().required(),
        mng_faqs: Joi.boolean().required(),
        mng_user_review: Joi.boolean().required(),
        mng_subs_price: Joi.boolean().required(),
        mng_tc_pc: Joi.boolean().required(),
      }).required(),

      status: Joi.string()
        .required()
        .regex(/^[0|1]$/, "Please send proper status values"),
    }),
    update_user: Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.number().required(),
      status: Joi.number().required(),
    }),
  },
  schema_posts: {
    add_featured_image: async (req, res, next) => {
      try {
        var upload = multer({
          //  storage: storage_banner_image,
          storage:
            Config.environment == "local"
              ? storage_featured_image
              : multerS3ConfigClient,
          limits: {
            fileSize: 2000000, // Compliant: 2MB
          },
          fileFilter: (req, file, cb) => {
            var ext = path.extname(file.originalname).toLowerCase();

            if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
              var validateImage = validatingImage(
                module.exports.schemas.featured_image
              );
              if (validateImage) {
                cb(null, true);
              }
            } else {
              cb(null, false);
              return cb("Only images allowed!", null);
            }
          },
        }).single("file");
        upload(req, res, async function (err) {
          if (err) {
            let data = {};
            data.file = err;
            res
              .status(400)
              .json({
                status: 2,
                errors: data,
              })
              .end();
          } else {
            next();
          }
        });
      } catch (err) {
        console.log("====>", err);
        res.status(400).json({
          status: 3,
          message: "server error",
        });
      }
    },
    add_review_image: async (req, res, next) => {
      try {
        var upload = multer({
          storage:
            Config.environment == "local"
              ? storage_review_image
              : multerS3ConfigClientReviewImage,
          limits: {
            fileSize: 2000000, // Compliant: 2MB
          },
          fileFilter: (req, file, cb) => {
            var ext = path.extname(file.originalname).toLowerCase();

            if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
              var validateImage = validatingImage(
                module.exports.schemas.review_image
              );
              if (validateImage) {
                cb(null, true);
              }
            } else {
              cb(null, false);
              return cb("Only images allowed!", null);
            }
          },
        }).single("file");
        upload(req, res, async function (err) {
          if (err) {
            let data = {};
            data.file = err;
            res
              .status(400)
              .json({
                status: 2,
                errors: data,
              })
              .end();
          } else {
            next();
          }
        });
      } catch (err) {
        console.log("====>", err);
        res.status(400).json({
          status: 3,
          message: "server error",
        });
      }
    },
    add_tc_pc_image: async (req, res, next) => {
      try {
        var upload = multer({
          storage:
            Config.environment == "local"
              ? storage_banner_image
              : multerS3ConfigClientReviewImage,
          limits: {
            fileSize: 2000000, // Compliant: 2MB
          },
          fileFilter: (req, file, cb) => {
            var ext = path.extname(file.originalname).toLowerCase();

            if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
              var validateImage = validatingImage(
                module.exports.schemas.banner_image
              );
              if (validateImage) {
                cb(null, true);
              }
            } else {
              cb(null, false);
              return cb("Only images allowed!", null);
            }
          },
        }).single("file");
        upload(req, res, async function (err) {
          if (err) {
            let data = {};
            data.file = err;
            res
              .status(400)
              .json({
                status: 2,
                errors: data,
              })
              .end();
          } else {
            next();
          }
        });
      } catch (err) {
        console.log("====>", err);
        res.status(400).json({
          status: 3,
          message: "server error",
        });
      }
    },
    contact_id: async (req, res, next) => {
      try {
        const contact_id = req.params.contact_id;
        let err = {};
        const contact_id_exists = await admModel.contact_id_exists(contact_id);

        if (contact_id_exists.length == 0) {
          err.contact_id = "Contact id doesn't exist";
        }

        if (common.isEmptyObj(err)) {
          next();
        } else {
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
      } catch (err) {
        common.logError(err);
        res
          .status(400)
          .json({
            status: 3,
            message: Config.errorText.value,
          })
          .end();
      }
    },
    tc_pc_id: async (req, res, next) => {
      try {
        const tc_pc_id = req.params.id;

        let err = {};
        const tc_pc_id_exists = await admModel.tc_pc_id_exists(tc_pc_id);

        if (tc_pc_id_exists.length == 0) {
          err.tc_pc_id = "No record found";
        }

        if (common.isEmptyObj(err)) {
          next();
        } else {
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
      } catch (err) {
        common.logError(err);
        res
          .status(400)
          .json({
            status: 3,
            message: Config.errorText.value,
          })
          .end();
      }
    },
    add_sub_admin: async (req, res, next) => {
      try {
        const { username, email, phone } = req.body;

        let err = {};
        const usernameExists = await admModel.usernameExists(
          entities.encode(username)
        );

        if (usernameExists.length > 0) {
          err.username = "Username already exists";
        }
        const email_exists = await admModel.email_exists(
          entities.encode(email)
        );

        if (email_exists.length > 0) {
          err.email = "Email already exists";
        }
        const phoneExists = await admModel.phoneExists(phone);

        if (phoneExists.length > 0) {
          err.phone = "Phone number already exists";
        }
        if (common.isEmptyObj(err)) {
          next();
        } else {
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
      } catch (err) {
        common.logError(err);
        res
          .status(400)
          .json({
            status: 3,
            message: Config.errorText.value,
          })
          .end();
      }
    },
    update_sub_admin: async (req, res, next) => {
      try {
        const { username, email, phone } = req.body;
        const { id } = req.params;

        let err = {};
        const get_sub_admin_exist = await admModel.get_sub_admin_exist(id);
        if (get_sub_admin_exist.length == 0) {
          let return_err = { status: 2, errors: "Sub admin does not exist" };
          return res.status(400).json(return_err);
        }

        const usernameExists = await admModel.usernameExists(
          entities.encode(username),
          id
        );

        if (usernameExists.length > 0) {
          err.username = "Username already exists";
        }
        const email_exists = await admModel.email_exists(
          entities.encode(email),
          id
        );

        if (email_exists.length > 0) {
          err.email = "Email already exists";
        }
        const phoneExists = await admModel.phoneExists(phone, id);

        if (phoneExists.length > 0) {
          err.phone = "Phone number already exists";
        }
        if (common.isEmptyObj(err)) {
          next();
        } else {
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
      } catch (err) {
        common.logError(err);
        res
          .status(400)
          .json({
            status: 3,
            message: Config.errorText.value,
          })
          .end();
      }
    },
    delete_sub_admin: async (req, res, next) => {
      try {
        const { id } = req.params;
        let err = {};
        const get_sub_admin_exist = await admModel.get_sub_admin_exist(id);
        if (get_sub_admin_exist.length == 0) {
          err.id = "Sub admin does not exist";
        }
        if (common.isEmptyObj(err)) {
          next();
        } else {
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
      } catch (err) {
        common.logError(err);
        res
          .status(400)
          .json({
            status: 3,
            message: Config.errorText.value,
          })
          .end();
      }
    },
  },
};
