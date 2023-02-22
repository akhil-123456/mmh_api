const partnerModel = require("../models/partner");
const userModel = require("../models/user");
const commonModel = require("../models/common");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const common = require("../controllers/common");
const Config = require("../configuration/config");
const dateFormat = require("dateformat");
const moment = require("moment");

module.exports = {
  check_partner: async (req, res, next) => {
    try {
      var partner_email = "";
      var partner_phone = "";
      if (!!req.body.email) {
        partner_email = req.body.email;
      }

      if (!!req.body.phone) {
        partner_phone = req.body.phone;
      }

      let err = {};
      if (partner_email == "" && partner_phone == "") {
        return res.status(400).json({
          err: "Please enter phone or email",
        });
      }
      if (partner_email != "" && partner_phone != "") {
        return res.status(400).json({
          err: "Please enter either phone or email",
        });
      }

      const userExist = await userModel.get_user_details(
        entities.encode(partner_email.toLowerCase()),
        partner_phone
      );
      if (userExist.length > 0) {
        err.user = "A user already exists with this credential";
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

  validate_otp: async (req, res, next) => {
    try {
      var phone = req.body.phone;
      var otp = req.body.otp;

      let err = {};
      const now = common.currentDateTime();
      const current_time = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const validate_otp = await commonModel.validate_otp(phone, "P");

      if (validate_otp.length == 0) {
        err.otp = "No otp found for this number";
      } else {
        let difference = moment(current_time).diff(
          moment(validate_otp[0].created_at),
          "seconds"
        );

        if (difference > 1000000000) {
          err.otp = "Otp expired. Please resend otp";
          // const expire_otp = await commonModel.expire_otp(
          //   validate_otp.id,
          //   current_time
          // );

          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        } else {
          if (otp != validate_otp[0].otp) {
            let return_err = { status: 2, errors: "Invalid Otp" };
            return res.status(400).json(return_err);
          }
        }
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

  resend_otp: async (req, res, next) => {
    try {
      var phone = req.body.phone;

      let err = {};
      const now = common.currentDateTime();
      const current_time = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const validate_otp = await commonModel.validate_otp(phone, "P");

      if (validate_otp.length == 0) {
        err.otp = "No otp found for this number";
      } else {
        let difference = moment(current_time).diff(
          moment(validate_otp[0].created_at),
          "seconds"
        );

        if (difference < 60) {
          err.otp = "Please wait for 60 seconds";
          let return_err = { status: 2, errors: err };
          return res.status(400).json(return_err);
        }
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

  register_by_num: async (req, res, next) => {
    try {
      var partner_phone = "";
      var otp = "";

      if (!!req.body.phone) {
        partner_phone = req.body.phone;
      }
      if (!!req.body.otp) {
        otp = req.body.otp;
      }

      let err = {};

      const userExist = await userModel.get_user_details("", partner_phone);
      if (userExist.length > 0) {
        err.user = "A user already exist with this number";
      }

      const check_partner_number = await partnerModel.partnerExist(
        "",
        partner_phone
      );
      if (check_partner_number.length > 0) {
        err.user =
          "A partner already exists with this number. Please login again.";
      }

      const check_otp = await commonModel.check_otp(partner_phone, otp, "P");
      if (check_otp.length == 0) {
        err.user = "Wrong OTP!";
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
};
