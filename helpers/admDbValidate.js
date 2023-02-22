const db = require("../configuration/dbConn");
const admModel = require("../models/adm");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const common = require("../controllers/common");
const Config = require("../configuration/config");

module.exports = {
  register: async (req, res, next) => {
    next();
  },

  validate_contact_id: async (req, res, next) => {
    var contact_id = req.params.contact_id;

    const checkContactExist = await admModel.check_contact_exist(contact_id);

    let err = {};
    if (!checkContactExist.success) {
      err = "Contact detail not found";
    }
    if (common.isEmptyObj(err)) {
      next();
    } else {
      let return_err = { status: 2, errors: err };
      return res.status(400).json(return_err);
    }
  },
  update_admin: async (req, res, next) => {
    const { email, username, group_id, password } = req.value.body;
    const admin = {
      email: entities.encode(email),
      username: entities.encode(username),
      group_id: group_id,
      password: password,
    };

    let err = {};
    const emailExists = await admModel.email_exists(
      admin.email,
      req.value.params.id
    );
    if (emailExists.success) {
      err.email = "Email already exists";
    }
    const usernameExists = await admModel.username_exists(
      admin.username,
      req.value.params.id
    );
    if (usernameExists.success) {
      err.username = "Username already exists";
    }
    const groupExists = await admModel.admin_group_exists(admin.group_id);
    if (!groupExists.success) {
      err.group_id = "Invalid group id posted";
    }

    if (common.isEmptyObj(err)) {
      next();
    } else {
      let return_err = { status: 2, errors: err };
      return res.status(400).json(return_err);
    }
  },
  update_self: async (req, res, next) => {
    const { email, username, group_id } = req.value.body;
    const admin = {
      email: entities.encode(email),
      username: entities.encode(username),
      group_id: group_id,
    };

    let err = {};
    const emailExists = await admModel.email_exists(admin.email, req.user.id);
    if (emailExists.success) {
      err.email = "Email already exists";
    }
    const usernameExists = await admModel.username_exists(
      admin.username,
      req.user.id
    );
    if (usernameExists.success) {
      err.username = "Username already exists";
    }
    const groupExists = await admModel.admin_group_exists(admin.group_id);
    if (!groupExists.success) {
      err.group_id = "Invalid group id posted";
    }

    if (common.isEmptyObj(err)) {
      next();
    } else {
      let return_err = { status: 2, errors: err };
      return res.status(400).json(return_err);
    }
  },
  update_user: async (req, res, next) => {
    var user_id = req.params.id;
    const { email, phone } = req.body;
    let err = {};
    const checkUserExist = await admModel.check_user_exist(user_id);
    const checkEmailExist = await admModel.check_user_email_exist(
      entities.encode(email),
      user_id
    );
    const checkPhoneExist = await admModel.check_user_phone_exist(
      phone,
      user_id
    );

    if (!checkUserExist.success) {
      err = "User not found";
    }
    if (checkEmailExist.success) {
      err.email = "Email already exist for a user ";
    }
    if (checkPhoneExist.success) {
      err.phone = "Phone no. already exist for a user ";
    }
    if (common.isEmptyObj(err)) {
      next();
    } else {
      let return_err = { status: 2, errors: err };
      return res.status(400).json(return_err);
    }
  },
};
