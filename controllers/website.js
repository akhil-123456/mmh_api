const JWT = require("jsonwebtoken");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const bcrypt = require("bcryptjs");
const Config = require("../configuration/config");
const Cryptr = require("cryptr");
const dateFormat = require("dateformat");
const cryptr = new Cryptr(Config.cryptR.secret);
const common = require("./common");
const websiteModel = require("../models/website");
const globalAdminLimit = 20;
var ip = require("ip");
const path = require("path");
const fs = require("fs");
// const websiteModel = require("../models/website");
const excel = require("exceljs");
const { replace } = require("lodash");

module.exports = {
  contact_us: async (req, res, next) => {
    try {
      const { name, email, number, description } = req.body;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const status = 1;
      await websiteModel
        .contact_us(
          entities.encode(name),
          entities.encode(email),
          entities.encode(description),
          number,
          created_at,
          status
        )
        .then(async function (data) {
          // await common.sendContactMailToAdmin(
          // 	'CONTACT_US_EMAILUS',
          // 	'akash@indusnet.co.in', //Admin email
          // 	user_email, //User email
          // 	user_name,
          // 	created_at,
          // 	entities.encode(contact_message),
          // 	user_id,
          // 	user_type
          // 	// place_order_task[0].order_id
          // );
          // await common.sendContactMailToUser(
          // 	'CONTACT_US_CUSTOMER',
          // 	'akash@indusnet.co.in', //replace (user_email) //User email
          // 	'alkem@indusnet.co.in',
          // 	user_name,
          // 	created_at,
          // 	contact_message,
          // 	user_id,
          // 	user_type
          // );
          res
            .status(200)
            .json({
              status: 1,
              //  data: data,
              message: "Data posted succesfully",
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
      await websiteModel
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

      await websiteModel
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

      await websiteModel
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
  master_service: async (req, res, next) => {
    try {
      await websiteModel
        .master_service()
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

  tc_pc_details: async (req, res, next) => {
    const { id } = req.params;
    try {
      await websiteModel
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

  get_partner_blog_list: async (req, res, next) => {
    const { partner_id } = req.params;
    try {
      await websiteModel
        .get_partner_blog_list(partner_id)
        .then(async function (data) {
          let concat_result = data.map(async (obj) => {
            if (Config.environment == "local") {
              return {
                ...obj,
                image_url: `${Config.website.backend_url}/partner_blog/${obj.new_name}`,
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
};
