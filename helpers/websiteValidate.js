const Joi = require("joi");
const common = require("../controllers/common");
const Config = require("../configuration/config");
const websiteModel = require("../models/website");
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
      // if (result.error) {
      //   let return_err = { status: 2, errors: "Invalid argument" };
      //   return res.status(400).json(return_err);
      // }
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
      req.value["params"] = result.value;
      next();
    };
  },
  schemas: {
    contact_us: Joi.object().keys({
      name: Joi.string().max(150).required(),
      email: Joi.string().email().max(250).required(),
      number: Joi.string()
        .regex(/^[0-9]{10}$/, `Phone number must have 10 digits.`)
        .required(),
      description: Joi.string().required(),
    }),
  },

  schema_posts: {
    tc_pc_details: async (req, res, next) => {
      try {
        const tc_pc_id = req.params.id;

        let err = {};
        const tc_pc_details = await websiteModel.tc_pc_details(tc_pc_id);

        if (tc_pc_details.length == 0) {
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
  },
};
