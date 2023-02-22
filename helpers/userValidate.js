const Joi = require("joi");
const common = require("../controllers/common");

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
    verify_email: Joi.object().keys({
      token: Joi.string().required(),
      name: Joi.string().max(150),
      password: Joi.string().required().min(3).max(20),
    }),
    verify_email_token: Joi.object().keys({
      token: Joi.string().required(),
    }),
    forgot_password: Joi.object().keys({
      email: Joi.string().email().required(),
    }),
    reset_password: Joi.object().keys({
      token: Joi.string().required(),
      password: Joi.string().required().min(3).max(20),
    }),
    partner_id: Joi.object().keys({
      partner_id: Joi.number().required(),
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
    check_email_password: Joi.object().keys({
      email: Joi.string().email().required(),
      user_type: Joi.string().required().min(3).max(3),
      password: Joi.string().required().min(3).max(200),
    }),
  },
  schema_posts: {},
};
