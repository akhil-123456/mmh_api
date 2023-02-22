const JWT = require("jsonwebtoken");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const admModel = require("../models/adm");
const Config = require("../configuration/config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(Config.cryptR.secret);
const common = require("./common");
const moment = require("moment");
const dateFormat = require("dateformat");
const today = Date.now();
const downloadDate = dateFormat(today, "dd-mmmm-yyyy");
const globalAdminLimit = 20;
const ip = require("ip");
const path = require("path");
const fs = require("fs");

const Excel = require("exceljs");
const { notEqual } = require("assert");

const URL =
  /^((https?|ftp):\/\/)?(www.)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

AdmloginToken = (admin_data) => {
  return JWT.sign(
    {
      iss: "MMH_ADMIN",
      sub: admin_data.admin_id,
      name: admin_data.name,
      admin_type: admin_data.admin_type,
      is_admin: 1,
      ag: admin_data.user_agent,
      iat: Math.round(new Date().getTime() / 1000),
      exp: Math.round(new Date().getTime() / 1000) + 24 * 60 * 60,
    },
    Config.jwt.secret
  );
};

generatePassword = (code) => {
  var salt = bcrypt.genSaltSync(5);
  var hash = bcrypt.hashSync("admin123", salt);
  return hash;
};

module.exports = {
  __get_signed_url: async (key) => {
    // try{
    return new Promise((resolve, reject) => {
      params = { Bucket: Config.aws.bucketName, Key: key, Expires: 86400 };

      AWS.config.update({
        accessKeyId: Config.aws.accessKeyId,
        secretAccessKey: Config.aws.secretAccessKey,
      });

      AWS.config.region = Config.aws.regionName;
      var s3 = new AWS.S3();
      s3.getSignedUrl("getObject", params, function (err, url) {
        if (err) {
          resolve({ status: 3, message: err });
        } else {
          resolve({ status: 1, url: url });
        }
      });
    });
  },
  handle_auth: async (req, res, next) => {
    if (Number.isInteger(req.user.id) && req.user.id > 0) {
      if (req.get("User-Agent") == req.user.ag) {
        next();
      } else {
        let return_err = { status: 5, message: "Unauthorized" };
        return res.status(401).json(return_err);
      }
    } else {
      let return_err = { status: 5, message: "Unauthorized" };
      return res.status(401).json(return_err);
    }
  },
  handle_login: async (req, res, next) => {
    if (Number.isInteger(req.user.id) && req.user.id > 0) {
      next();
    } else {
      let err_data = { password: "Invalid login details" };
      return res.status(400).json({ status: 2, errors: err_data });
    }
  },

  login: async (req, res, next) => {
    if (Number.isInteger(req.user.id) && req.user.id > 0) {
      let adm_data = {
        admin_id: cryptr.encrypt(req.user.id),
        name: req.user.first_name,
        admin_type: req.user.admin_type.toUpperCase(),
        user_agent: cryptr.encrypt(req.get("User-Agent")),
      };
      const token = AdmloginToken(adm_data);
      let login_attempt = {
        admin_id: req.user.id,
        login_date: common.currentDateTime(),
        ip_address: ip.address(),
      };
      await admModel.login_log(login_attempt);

      res.status(200).json({ status: 1, token: token });
    } else {
      let err_data = { password: "Invalid login details" };
      return res.status(400).json({ status: 2, errors: err_data });
    }
  },

  contact_us: async (req, res, next) => {
    try {
      if (req.query.page && req.query.page > 0) {
        var page = req.query.page;
        var limit = globalAdminLimit;
        var offset = (page - 1) * globalAdminLimit;
      } else {
        var limit = globalAdminLimit;
        var offset = 0;
      }
      var search_text = "";
      var status = "";
      if (!!req.query.search_text) {
        search_text = req.query.search_text;
      }
      if (!!req.query.status) {
        status = req.query.status;
      }

      var start_date = req.query.start_date
        ? entities.encode(req.query.start_date)
        : "";
      var end_date = req.query.end_date
        ? entities.encode(req.query.end_date)
        : "";

      await admModel
        .contact_us(
          entities.encode(search_text.toLowerCase()),
          start_date,
          end_date,
          limit,
          offset,
          entities.encode(status)
        )
        .then(async function (data) {
          let count = await admModel.contact_us_count(
            entities.encode(search_text.toLowerCase()),
            start_date,
            end_date,
            entities.encode(status)
          );
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              count: Number(count[0].count),
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  contact_reply: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { reply_message } = req.body;
      // var plant_id = plant.toString();
      let contact_id = req.params.contact_id;
      const contact_detail = await admModel.get_contact_detail(contact_id);

      reply_status = "R";
      /*  const updateReplyMsgObj = {
      reply_message : reply_message,
      reply_status : reply_status,
      contact_id : contact_id
    }; */
      const updateReplyMsgObj = {
        reply_message: reply_message,
        created_at: created_at,
        contact_id: contact_id,
      };
      const mailParams = {
        name: contact_detail[0].name,
        email: contact_detail[0].email,
        message: reply_message,
      };
      //return;
      await admModel
        .contact_reply_insert(updateReplyMsgObj)
        .then(async function (data) {
          await admModel.update_contact_status(contact_id);
          await common.admin_contact_mail_reply(
            "ADMIN_REPLY",
            "inderjit.singh@mapmyhouse.com", //User email
            "inderjit.singh@mapmyhouse.com", //Admin email
            mailParams,
            ""
          );
          res
            .status(200)
            .json({
              status: 1,
              message: "Contact Replied successfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  delete_contact_us: async (req, res, next) => {
    try {
      const { contact_id } = req.params;
      const updated_at = common.currentDateTime();

      await admModel
        .delete_contact_us(contact_id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "User Query deleted",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  reply_query: async (req, res, next) => {
    try {
      const { contact_id } = req.params;
      const { email, reply_message } = req.body;
      const updated_at = common.currentDateTime();
      const admin_id = req.user.user_id;

      await admModel
        .reply_query(
          contact_id,
          entities.encode(reply_message),
          updated_at,
          admin_id
        )
        .then(async function (data) {
          const mailParams = {
            message: reply_message,
          };
          await common
            .admin_user_query_reply(
              "ADMIN_REPLY",
              email, //User email
              mailParams
            )
            .then(async function (data) {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "User Replied Successfully",
                })
                .end();
            })
            .catch((err) => {
              common.logError(err);
              res
                .status(400)
                .json({
                  status: 3,
                  message: Config.errorText.value,
                })
                .end();
            });
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  create_featured_image: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const { title, status } = req.body;
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await admModel
        .create_featured_image(
          title,
          req.file.originalname,
          Config.environment == "local" ? req.file.filename : req.file.key,
          created_at,
          status
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Image uploaded succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  get_featured_list: async (req, res, next) => {
    try {
      var status = req.query.status ? entities.encode(req.query.status) : "";
      await admModel
        .get_featured_list(status)
        .then(async function (data) {
          let concat_result = data.map(async (obj) => {
            if (Config.environment == "local") {
              return {
                ...obj,
                image_url: `${Config.website.backend_url}/featured_image/${obj.new_name}`,
              };
            } else {
              return {
                ...obj,
                image_url: `${Config.aws.s3staticUrl}/${obj.new_name}`,
              };
            }
          });

          await Promise.all(concat_result).then((result) => {
            concat_result = result;
          });

          res
            .status(200)
            .json({
              status: 1,
              data: concat_result,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  delete_featured_image: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated_at = common.currentDateTime();

      await admModel
        .delete_featured_image(id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Featured image deleted",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  change_status_featured_image: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated_at = common.currentDateTime();

      await admModel
        .change_status_featured_image(id, status, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Featured image status updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  create_faq: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { title, description, status } = req.body;

      await admModel
        .create_faq(
          entities.encode(title),
          entities.encode(description),
          status,
          created_at
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "FAQ created",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
      /*  } else {
          res
              .status(200)
              .json({
                status: 1,
                message: "User already exist",
              })
              .end();
        } */
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
  faq_list: async (req, res, next) => {
    try {
      var search_text = "";
      var status = "";
      if (!!req.query.search_text) {
        search_text = req.query.search_text;
      }
      if (!!req.query.status) {
        status = req.query.status;
      }

      await admModel
        .faq_list(
          entities.encode(search_text.toLowerCase()),
          entities.encode(status)
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  update_faq: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { id } = req.params;
      const { title, description, status } = req.body;

      await admModel
        .update_faq(
          entities.encode(title),
          entities.encode(description),
          status,
          updated_at,
          id
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "FAQ updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  change_status_faq: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated_at = common.currentDateTime();

      await admModel
        .change_status_faq(id, status, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Faq status updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  delete_faq: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated_at = common.currentDateTime();

      await admModel
        .delete_faq(id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "FAQ deleted",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  create_user_feedback: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const { name, designation, review, status } = req.body;
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await admModel
        .create_user_feedback(
          entities.encode(name),
          entities.encode(designation),
          entities.encode(review),
          req.file.originalname,
          Config.environment == "local" ? req.file.filename : req.file.key,
          created_at,
          status
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Review added succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  review_list: async (req, res, next) => {
    try {
      var search_text = "";
      var status = "";
      if (!!req.query.search_text) {
        search_text = req.query.search_text;
      }
      if (!!req.query.status) {
        status = req.query.status;
      }

      await admModel
        .review_list(
          entities.encode(search_text.toLowerCase()),
          entities.encode(status)
        )
        .then(async function (data) {
          let concat_result = data.map(async (obj) => {
            if (Config.environment == "local") {
              return {
                ...obj,
                image_url: `${Config.website.backend_url}/review_image/${obj.new_name}`,
              };
            } else {
              return {
                ...obj,
                image_url: `${Config.aws.s3staticUrl}/${obj.new_name}`,
              };
            }
          });

          await Promise.all(concat_result).then((result) => {
            concat_result = result;
          });
          res
            .status(200)
            .json({
              status: 1,
              data: concat_result,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  change_status_review: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated_at = common.currentDateTime();

      await admModel
        .change_status_review(id, status, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Review status updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  delete_user_feedback: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated_at = common.currentDateTime();

      await admModel
        .delete_user_feedback(id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Review deleted",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  update_user_feedback: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const { id } = req.params;
      const { name, designation, review, status } = req.body;
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      const obj = {
        name: entities.encode(name),
        designation: entities.encode(designation),
        review: entities.encode(review),
        status: status,
        updated_at,
      };
      if (!!req.file) {
        obj.originalname = entities.encode(req.file.originalname);
        obj.new_name =
          Config.environment == "local" ? req.file.filename : req.file.key;
      }
      await admModel
        .update_user_feedback(obj, id)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Review added succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  user_list: async (req, res, next) => {
    try {
      if (req.query.page && req.query.page > 0) {
        var page = req.query.page;
        var limit = globalAdminLimit;
        var offset = (page - 1) * globalAdminLimit;
      } else {
        var limit = globalAdminLimit;
        var offset = 0;
      }
      var search_text = "";
      var status = "";
      if (!!req.query.search_text) {
        search_text = req.query.search_text;
      }
      if (!!req.query.status) {
        status = req.query.status;
      }
      var start_date = req.query.start_date
        ? entities.encode(req.query.start_date)
        : "";
      var end_date = req.query.end_date
        ? entities.encode(req.query.end_date)
        : "";

      await admModel
        .user_list(
          entities.encode(search_text.toLowerCase()),
          entities.encode(status),
          start_date,
          end_date,
          limit,
          offset
        )
        .then(async function (data) {
          const count_user = await admModel.count_users(
            entities.encode(search_text.toLowerCase()),
            entities.encode(status),
            start_date,
            end_date
          );
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              count: count_user[0].count,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  delete_user: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated_at = common.currentDateTime();

      await admModel
        .delete_user(id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "User deleted",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  update_user: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { id } = req.params;

      const { title, description, status } = req.body;

      await admModel
        .update_faq(
          entities.encode(title),
          entities.encode(description),
          status,
          updated_at,
          id
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "FAQ updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  // price controller
  price_list: async (req, res, next) => {
    try {
      await admModel
        .price_list()
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  update_price: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { id } = req.params;
      const { price_monthly } = req.body;
      const { price_yearly } = req.body;

      await admModel
        .update_price(
          entities.encode(price_monthly),
          entities.encode(price_yearly),
          updated_at,
          id
        )
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Price updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  // t&c p&p
  get_tc_pp_list: async (req, res, next) => {
    try {
      // var status = req.query.status ? entities.encode(req.query.status) : "";
      await admModel
        .get_tc_pp_list()
        .then(async function (data) {
          let concat_result = data.map(async (obj) => {
            if (Config.environment == "local") {
              return {
                ...obj,
                image_url: `${Config.website.backend_url}/banner_image/${obj.new_name}`,
              };
            } else {
              return {
                ...obj,
                image_url: `${Config.aws.s3staticUrl}/${obj.new_name}`,
              };
            }
          });

          await Promise.all(concat_result).then((result) => {
            concat_result = result;
          });

          res
            .status(200)
            .json({
              status: 1,
              data: concat_result,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  tc_pc_details: async (req, res, next) => {
    try {
      const { id } = req.params;

      await admModel
        .tc_pc_details(id)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  update_tc_pp: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const { id } = req.params;
      const { title, description } = req.body;
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      const obj = {
        title: entities.encode(title),
        description: entities.encode(description),
        updated_at,
      };
      if (!!req.file) {
        obj.orignal_name = entities.encode(req.file.originalname);
        obj.new_name =
          Config.environment == "local" ? req.file.filename : req.file.key;
      }
      await admModel
        .update_tc_pp(obj, id)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "t&C P&p added succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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

  get_sub_admin: async (req, res, next) => {
    try {
      if (req.query.page && req.query.page > 0) {
        var page = req.query.page;
        var limit = globalAdminLimit;
        var offset = (page - 1) * globalAdminLimit;
      } else {
        var limit = globalAdminLimit;
        var offset = 0;
      }
      var search_text = "";
      var status = "";
      if (!!req.query.search_text) {
        search_text = req.query.search_text;
      }
      if (!!req.query.status) {
        status = req.query.status;
      }
      var start_date = req.query.start_date
        ? entities.encode(req.query.start_date)
        : "";
      var end_date = req.query.end_date
        ? entities.encode(req.query.end_date)
        : "";

      await admModel
        .get_sub_admin(
          entities.encode(search_text.toLowerCase()),
          entities.encode(status),
          start_date,
          end_date,
          limit,
          offset
        )
        .then(async function (data) {
          const count_sub_admin = await admModel.count_sub_admin(
            entities.encode(search_text.toLowerCase()),
            entities.encode(status),
            start_date,
            end_date
          );
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              count: count_sub_admin[0].count,
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
      const {
        first_name,
        last_name,
        username,
        email,
        status,
        phone,
        permissions,
      } = req.value.body;
      var randomstring = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomstring, salt);
      const admobj = {
        username: entities.encode(username),
        password: passwordHash,
        email: entities.encode(email),
        first_name: entities.encode(first_name),
        last_name: entities.encode(last_name),
        phone: phone,
        status: status,
        added_by: req.user.user_id,
        date_added: common.currentDateTime(),
        admin_type: "SUB",
      };

      await admModel
        .add_sub_admin(admobj)
        .then(async function (data) {
          await admModel
            .add_admin_permission(
              permissions,
              data.id,
              common.currentDateTime()
            )
            .then((perm_data) => {
              let mailParam = {
                full_name: first_name + " " + last_name,
                username: username,
                password: randomstring,
              };
              const mailSent = common.sendMailToNewSubAdmin(
                "NEW_SUB_ADMIN_ADD",
                email,
                mailParam
              );
              if (mailSent) {
                return res.status(200).json({
                  status: 1,
                  mail_message: "Email sent",
                  message: "Sub admin added",
                  data: data,
                });
              } else {
                return res.status(400).json({
                  status: 2,
                  mail_message: "Email has not been sent",
                  message: "Sub admin not added",
                  data: data,
                });
              }
            })
            .catch((err) => {
              common.logError(err);
              res
                .status(400)
                .json({
                  status: 3,
                  message: Config.errorText.value,
                })
                .end();
            });
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
      const now = common.currentDateTime();
      const { id } = req.params;
      const {
        first_name,
        last_name,
        username,
        email,
        status,
        phone,
        permissions,
      } = req.value.body;
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      const admobj = {
        username: entities.encode(username),
        email: entities.encode(email),
        first_name: entities.encode(first_name),
        last_name: entities.encode(last_name),
        phone: phone,
        status: status,
        updated_by: req.user.user_id,
        updated_at: updated_at,
        admin_type: "SUB",
      };
      await admModel
        .update_sub_admin(admobj, id)
        .then(async function (data) {
          await admModel.update_sub_admin_permission(
            permissions,
            id,
            status,
            updated_at
          );
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Sub admin updated succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const { id } = req.params;

      await admModel
        .delete_sub_admin(id, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Sub admin deleted succesfully",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
  change_status_sub_admin: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated_at = common.currentDateTime();

      await admModel
        .change_status_sub_admin(id, status, updated_at)
        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              message: "Sub admin status updated",
            })
            .end();
        })
        .catch((err) => {
          common.logError(err);
          res
            .status(400)
            .json({
              status: 3,
              message: Config.errorText.value,
            })
            .end();
        });
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
};
