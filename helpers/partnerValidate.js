const Joi = require("joi");
const number = require("joi/lib/types/number");
const common = require("../controllers/common");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const Config = require("../configuration/config");
const multer = require("multer");
const path = require("path");

const { uuid } = require("uuidv4");
const s3Config = new AWS.S3({
  accessKeyId: Config.aws.accessKeyId,
  secretAccessKey: Config.aws.secretAccessKey,
  Bucket: Config.aws.bucketName,
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
      "uploads/partner_image/" +
      Math.floor(Date.now() / 1000) +
      "-" +
      uuid() +
      extention;
    cb(null, new_file_name);
  },
});

var multerS3ConfigpartnerImage = multerS3({
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
      "uploads/partner_blog/" +
      Math.floor(Date.now() / 1000) +
      "-" +
      uuid() +
      extention;
    cb(null, new_file_name);
  },
});

var storage_partner_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/partner_image"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

var storage_partner_blog_image = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, "../uploads/partner_blog"));
  },
  filename: function (req, file, callback) {
    var extention = path.extname(file.originalname);
    var new_file_name = +new Date() + "-" + uuid() + extention;
    callback(null, new_file_name);
  },
});

module.exports = {
  validateBody: (schema) => {
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
    authSchema: Joi.object().keys({
      email: Joi.string().optional().email().max(80),
      phone: Joi.string()
        .optional()
        .min(10)
        .max(10)
        .regex(/^[0-9]*$/, "numeric values only"),
    }),
    validate_otp: Joi.object().keys({
      phone: Joi.string()
        .required()
        .min(10)
        .max(10)
        .regex(/^[0-9]*$/, "numeric values only"),
      otp: Joi.string()
        .required()
        .min(4)
        .max(4)
        .regex(/^[0-9]*$/, "numeric values only"),
      user_type: Joi.string().required().min(3).max(3),
    }),
    resend_otp: Joi.object().keys({
      phone: Joi.string()
        .required()
        .min(10)
        .max(10)
        .regex(/^[0-9]*$/, "numeric values only"),
      user_type: Joi.string().required().min(3).max(3),
    }),
    verify_email_token: Joi.object().keys({
      token: Joi.string().required(),
    }),
    verify_email: Joi.object().keys({
      token: Joi.string().required(),
      name: Joi.string().max(150),
      password: Joi.string().required().min(3).max(20),
    }),
    register_by_num: Joi.object().keys({
      name: Joi.string().max(150),
      otp: Joi.string()
        .required()
        .min(4)
        .max(4)
        .regex(/^[0-9]*$/, "numeric values only"),
      phone: Joi.string()
        .required()
        .min(10)
        .max(10)
        .regex(/^[0-9]*$/, "numeric values only"),

      user_type: Joi.string().required().min(3).max(3),
    }),
    forgot_password: Joi.object().keys({
      email: Joi.string().email().required(),
    }),
    reset_password: Joi.object().keys({
      token: Joi.string().required(),
      password: Joi.string().required().min(3).max(20),
    }),
    check_email_password: Joi.object().keys({
      email: Joi.string().email().required(),
      user_type: Joi.string().required().min(3).max(3),
      password: Joi.string().required().min(3).max(20),
    }),

    partner_image: Joi.object().keys({
      file: Joi.required(),
      status: Joi.number().required(),
      firm_name: Joi.string().required().max(150),
      firm_city: Joi.string().required().max(100),
      work_email: Joi.string().required().max(150),
      website: Joi.string().required().max(250),
      team_strength: Joi.number().required().max(4),
      year_industry: Joi.number().required().max(99),
      projects_delivered: Joi.string().required().max(999),
      no_of_offices: Joi.number().required().max(999),
      fees_range_min: Joi.number().required().min(99),
      fees_range_max: Joi.number().required().max(99),
      description: Joi.string().required(),
      liknedin_website: Joi.string().required(),
      instagram_website: Joi.string().required(),
      youtube_website: Joi.string().required(),
      pinterest_website: Joi.string().required(),
      paid_type: Joi.string().required(),
      service: Joi.array().items(
        Joi.object({
          service_id: Joi.number().required(),
          service_name: Joi.string().required(),
        }).required()
      ),
    }),
    partner_blog: Joi.object().keys({
      file: Joi.required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
      link: Joi.string().required(),
      status: Joi.number().required(),
    }),
  },

  schema_posts: {
    add_partner_image: async (req, res, next) => {
      try {
        var upload = multer({
          //  storage: storage_banner_image,
          storage:
            Config.environment == "local"
              ? storage_partner_image
              : multerS3ConfigpartnerImage,
          limits: {
            fileSize: 2000000, // Compliant: 2MB
          },
          fileFilter: (req, file, cb) => {
            var ext = path.extname(file.originalname).toLowerCase();

            if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
              var validateImage = validatingImage(
                module.exports.schemas.partner_image
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

    // partner blog

    partner_blog_image: async (req, res, next) => {
      try {
        var upload = multer({
          //  storage: storage_banner_image,
          storage:
            Config.environment == "local"
              ? storage_partner_blog_image
              : multerS3ConfigClientReviewImage,
          limits: {
            fileSize: 2000000, // Compliant: 2MB
          },
          fileFilter: (req, file, cb) => {
            var ext = path.extname(file.originalname).toLowerCase();

            if (ext == ".png" || ext == ".jpg" || ext == ".jpeg") {
              var validateImage = validatingImage(
                module.exports.schemas.partner_blog
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
  },
};
