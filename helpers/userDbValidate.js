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
  check_user: async (req, res, next) => {
    try {
      var user_email = "";
      var user_phone = "";
      if (!!req.body.email) {
        user_email = req.body.email;
      }

      if (!!req.body.phone) {
        user_phone = req.body.phone;
      }

      let err = {};
      if (user_email == "" && user_phone == "") {
        return res.status(400).json({
          err: "Please enter phone or email",
        });
      }
      if (user_email != "" && user_phone != "") {
        return res.status(400).json({
          err: "Please enter either phone or email",
        });
      }

      const partnerExist = await partnerModel.partnerExist(
        entities.encode(user_email.toLowerCase()),
        user_phone
      );
      if (partnerExist.success) {
        err.user = "A partner already exist with this credential";
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
      const validate_otp = await commonModel.validate_otp(phone, "U");

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
      const validate_otp = await commonModel.validate_otp(phone, "U");

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
      var user_phone = "";
      var otp = "";

      if (!!req.body.phone) {
        user_phone = req.body.phone;
      }
      if (!!req.body.otp) {
        otp = req.body.otp;
      }

      let err = {};

      const partnerExist = await partnerModel.partnerExist("", user_phone);
      if (partnerExist.success) {
        err.user = "A partner already exist with this number";
      }

      const check_user_number = await userModel.check_user_number(user_phone);
      if (check_user_number.length > 0) {
        err.user =
          "A user already exists with this number. Please login again.";
      }

      const check_otp = await commonModel.check_otp(user_phone, otp, "U");
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

  add_wishlist: async (req, res, next) => {
    try {
      const { partner_id } = req.params;
      const user_id = req.user.id;

      let err = {};
      const partnerExist_with_id = await partnerModel.partnerExist_with_id(
        partner_id
      );
      if (!partnerExist_with_id.success) {
        err.user = "Partner not found";
      }
      const partnerExistWishlist = await userModel.partnerExistWishlist(
        partner_id,
        user_id
      );
      if (partnerExistWishlist.length > 0) {
        err.user = "This partner already exists in user's wishlist";
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
  delete_wishlist: async (req, res, next) => {
    try {
      const { partner_id } = req.params;
      const user_id = req.user.id;

      let err = {};
      const partnerExist_with_id = await partnerModel.partnerExist_with_id(
        partner_id
      );
      if (!partnerExist_with_id.success) {
        err.user = "Partner not found";
      }
      const partnerExistWishlist = await userModel.partnerExistWishlist(
        partner_id,
        user_id
      );
      if (partnerExistWishlist.length == 0) {
        err.user = "This partner is not in user's wishlist";
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
  book_partner: async (req, res, next) => {
    try {
      const { partner_id } = req.body;
      const user_id = req.user.id;

      let err = {};
      const partnerExist_with_id = await partnerModel.partnerExist_with_id(
        partner_id
      );
      if (!partnerExist_with_id.success) {
        err.user = "Partner not found";
      }
      const partnerExistBooking = await userModel.partnerExistBooking(
        partner_id,
        user_id
      );
      if (partnerExistBooking.length > 0) {
        err.user = "Partner already booked";
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
  cancel_booking: async (req, res, next) => {
    try {
      const { partner_id } = req.body;
      const user_id = req.user.id;

      let err = {};
      const partnerExist_with_id = await partnerModel.partnerExist_with_id(
        partner_id
      );
      if (!partnerExist_with_id.success) {
        err.user = "Partner not found";
      }
      const partnerExistBooking = await userModel.partnerExistBooking(
        partner_id,
        user_id
      );
      if (partnerExistBooking.length == 0) {
        err.user = "Partner is not yet booked";
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
