const JWT = require("jsonwebtoken");
const jwtSimple = require("jwt-simple");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const bcrypt = require("bcryptjs");
const partnerModel = require("../models/partner");
const commonModel = require("../models/common");
const Config = require("../configuration/config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(Config.cryptR.secret);
const common = require("./common");
const globalAdminLimit = 20;
const globalPartnerLimit = 12;
var ip = require("ip");
const dateFormat = require("dateformat");

const excel = require("exceljs");
const otpGenerator = require("otp-generator");

matchPassword = async function (newPassword, existingPassword) {
  try {
    return await bcrypt.compare(newPassword, existingPassword);
  } catch (error) {
    // throw new Error(error);
    console.log({ error });
    return false;
  }
};
PartnerLoginToken = (partner_data) => {
  return JWT.sign(
    {
      iss: "MMH",
      sub: partner_data.user_id,
      name: partner_data.name,
      email: partner_data.email,
      phone: partner_data.phone,
      user_type: partner_data.user_type,
      ag: partner_data.user_agent,
      iat: Math.round(new Date().getTime() / 1000),
      exp: Math.round(new Date().getTime() / 1000) + 24 * 60 * 60,
    },
    Config.jwt.secret
  );
};

module.exports = {
  partner_handle_auth: async (req, res, next) => {
    if (req.get("User-Agent") == req.user.ag) {
      if (req.user.id) {
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
    if (req.user.email) {
      next();
    } else {
      let err_data = { password: "Invalid login details" };
      return res.status(400).json({ status: 2, errors: err_data });
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, phone } = req.body;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const get_partner = await partnerModel.get_partner_details(
        !!email ? entities.encode(email.toLowerCase()) : "",
        !!phone ? phone : ""
      );
      if (get_partner.length > 0) {
        if (get_partner[0].status == 0) {
          return res.status(400).json({
            status: 2,
            error: "Your account is inactive. Please contact the sales team.",
            user_type: "OLD",
          });
        } else {
          if (!!email) {
            return res.status(200).json({
              status: 1,
              user_type: "OLD",
            });
          } else if (!!phone) {
            var otp = otpGenerator.generate(4, {
              upperCaseAlphabets: false,
              specialChars: false,
              lowerCaseAlphabets: false,
            });
            await commonModel.create_otp(phone, otp, created_at, "P", 1);
            return res.status(200).json({
              status: 1,
              otp: otp,
              user_type: "OLD",
            });
          }
        }
      } else {
        ////////////////NEW PARTNER////////////////
        if (!!email) {
          var payload = {
            time: new Date().getTime() + 72 * 60 * 60000,
            checksum: email,
          };
          var token = jwtSimple.encode(payload, Config.jwt.secret);
          await commonModel.create_email_token(email, token, "P", created_at);
          var url =
            Config.website.frontend_url + `/verify_partner_email/` + token;

          let mailParam = {
            url: url,
          };
          const mailSent = common.sendMailToPartnerVerify(
            "VERIFY_PARTNER_EMAIL",
            email,
            mailParam
          );
          if (mailSent) {
            return res.status(200).json({
              status: 1,
              message: "Email sent",
              user_type: "NEW",
              verify_url: `/verify_partner_email/` + token,
            });
          } else {
            return res.status(400).json({
              status: 2,
              message: "Email has not been sent",
              user_type: "NEW",
            });
          }
        } else if (!!phone) {
          var otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
          });
          await commonModel.create_otp(phone, otp, created_at, "P", 1);

          return res.status(200).json({
            status: 1,
            otp: otp,
            user_type: "NEW",
          });
        }
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
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      if (req.body.user_type == "OLD") {
        const get_partner = await partnerModel.get_partner(req.body.phone);
        if (get_partner.length > 0) {
          let partner_data = {
            user_id: cryptr.encrypt(get_partner[0].id),
            name: get_partner[0].name,
            phone: get_partner[0].phone,
            email: get_partner[0].email,
            user_type: "P",
            user_agent: cryptr.encrypt(req.get("User-Agent")),
          };
          const token = PartnerLoginToken(partner_data);

          res.status(200).json({ status: 1, token: token });
        } else {
          return res.status(400).json({
            staus: 2,
            message: "Invalid user type",
          });
        }
      } else {
        await commonModel
          .update_otp(req.body.phone, req.body.otp, created_at, "P")
          .then((data) => {
            return res.status(200).json({
              staus: 1,
              message: "Otp verified",
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
      const { phone } = req.body;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const get_partner = await partnerModel.get_partner_details(
        "",
        !!phone ? phone : ""
      );
      if (get_partner.length > 0) {
        if (get_partner[0].status == 0) {
          return res.status(200).json({
            status: 2,
            error: "Your account is inactive. Please contact the sales team.",
            user_type: "OLD",
          });
        } else {
          if (!!phone) {
            var otp = otpGenerator.generate(4, {
              upperCaseAlphabets: false,
              specialChars: false,
              lowerCaseAlphabets: false,
            });
            await commonModel.create_otp(phone, otp, created_at, "P", 1);
            return res.status(200).json({
              status: 1,
              otp: otp,
              user_type: "OLD",
            });
          }
        }
      } else {
        if (!!phone) {
          var otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
          });
          await commonModel.create_otp(phone, otp, created_at, "P", 1);

          return res.status(200).json({
            status: 1,
            otp: otp,
            user_type: "NEW",
          });
        }
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

  verify_email: async (req, res, next) => {
    try {
      const { name, token, password } = req.body;
      const user = {
        password: entities.encode(password),
        token: entities.encode(token),
      };
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      try {
        var decodedToken = jwtSimple.decode(user.token, Config.jwt.secret);
      } catch (error) {
        return res.status(400).json({
          status: 3,
          message: "Token is invalid",
        });
      }

      let tokenExist = await commonModel.findByUserEmail(
        decodedToken.checksum,
        "P"
      );
      if (tokenExist.length > 0) {
        if (tokenExist[0].token == token) {
          if (decodedToken.time > new Date().getTime()) {
            let password = user.password;
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            let get_partner_by_email = await partnerModel.get_partner_by_email(
              decodedToken.checksum
            );
            if (get_partner_by_email.length > 0) {
              await partnerModel.update_partner_password(
                entities.encode(name),
                passwordHash,
                decodedToken.checksum,
                created_at,
                1
              );
            } else {
              await partnerModel.create_partner_email(
                entities.encode(name),
                passwordHash,
                decodedToken.checksum,
                created_at,
                1
              );
            }

            await commonModel
              .update_email_token(decodedToken.checksum, created_at, token, "P")
              .then(async function (data) {
                const get_partner_by_email =
                  await partnerModel.get_partner_by_email(
                    decodedToken.checksum
                  );

                if (get_partner_by_email.length > 0) {
                  let partner_data = {
                    user_id: cryptr.encrypt(get_partner_by_email[0].id),
                    name: get_partner_by_email[0].name,
                    phone: get_partner_by_email[0].phone,
                    email: get_partner_by_email[0].email,
                    user_type: "P",
                    user_agent: cryptr.encrypt(req.get("User-Agent")),
                  };
                  const token = PartnerLoginToken(partner_data);

                  res.status(200).json({
                    status: 1,
                    message: "Password set successfully",
                    token: token,
                  });
                } else {
                  res
                    .status(400)
                    .json({
                      status: 3,
                      message: Config.errorText.value,
                    })
                    .end();
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
          } else {
            return res.status(400).json({
              status: 3,
              message: "Token expired please resend link",
            });
          }
        } else {
          return res.status(400).json({
            status: 3,
            message: "Token already used",
          });
        }
      } else {
        return res.status(400).json({
          status: 3,
          message: "Invalid token",
        });
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

  check_email_password: async (req, res, next) => {
    if (
      Number.isInteger(req.user.id) &&
      req.user.id > 0 &&
      req.body.user_type == "OLD"
    ) {
      let partner_data = {
        user_id: cryptr.encrypt(req.user.id),
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        user_type: "P",
        user_agent: cryptr.encrypt(req.get("User-Agent")),
      };
      const token = PartnerLoginToken(partner_data);

      res.status(200).json({ status: 1, token: token });
    } else {
      let err_data = { password: "Invalid login details" };
      return res.status(400).json({ status: 2, errors: err_data });
    }
  },
  register_by_num: async (req, res, next) => {
    try {
      const { name, phone, user_type } = req.body;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      if (user_type == "NEW") {
        const partner_exist = await partnerModel.get_partner(phone);
        if (partner_exist.length == 0) {
          await partnerModel.create_partner_phone(
            entities.encode(name),
            phone,
            created_at,
            1
          );
          const get_partner_by_phone = await partnerModel.get_partner(phone);

          if (get_partner_by_phone.length > 0) {
            let partner_data = {
              user_id: cryptr.encrypt(get_partner_by_phone[0].id),
              name: get_partner_by_phone[0].name,
              phone: get_partner_by_phone[0].phone,
              email: get_partner_by_phone[0].email,
              user_type: "P",
              user_agent: cryptr.encrypt(req.get("User-Agent")),
            };
            const token = PartnerLoginToken(partner_data);

            res.status(200).json({
              status: 1,
              message: "Partner registered successfully",
              token: token,
            });
          } else {
            return res.status(400).json({
              status: 3,
              message: "Partner not found",
            });
          }
        } else {
          return res.status(400).json({
            status: 3,
            message: "Partner already registered",
          });
        }
      } else {
        return res.status(400).json({
          status: 3,
          message: "Invalid user type",
        });
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

  verify_email_token: async (req, res, next) => {
    try {
      const { token } = req.body;
      try {
        var decodedToken = jwtSimple.decode(
          entities.encode(token),
          Config.jwt.secret
        );
      } catch (error) {
        return res.status(400).json({
          status: 3,
          message: "Token is invalid",
        });
      }

      let tokenExist = await commonModel.findByUserEmail(
        decodedToken.checksum,
        "P"
      );
      if (tokenExist.length > 0) {
        if (tokenExist[0].token == token) {
          if (decodedToken.time > new Date().getTime()) {
            res.status(200).json({
              status: 1,
              message: "Token valid",
            });
          } else {
            return res.status(400).json({
              status: 3,
              message: "Token expired please resend link",
            });
          }
        } else {
          return res.status(400).json({
            status: 3,
            message: "This link is already used",
          });
        }
      } else {
        return res.status(400).json({
          status: 3,
          message: "Invalid token",
        });
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
  create_partner: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const {
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
      } = req.body;
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await partnerModel
        .create_partner(
          req.file.originalname,
          Config.environment == "local" ? req.file.filename : req.file.key,
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
          req.user.id
        )

        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "partner added succesfully",
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

  get_partner_details: async (req, res, next) => {
    try {
      await partnerModel
        .get_partner_details_with_id(req.user.id)
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

  get_bookings: async (req, res, next) => {
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

      await partnerModel
        .get_bookings(
          req.user.id,
          entities.encode(search_text.toLowerCase()),
          start_date,
          end_date,
          entities.encode(status),
          limit,
          offset
        )
        .then(async function (data) {
          let count = await partnerModel.bookings_count(
            req.user.id,
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
  get_user_queries: async (req, res, next) => {
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

      await partnerModel
        .get_user_queries(
          req.user.id,
          entities.encode(search_text.toLowerCase()),
          start_date,
          end_date,
          entities.encode(status),
          limit,
          offset
        )
        .then(async function (data) {
          let count = await partnerModel.user_queries_count(
            req.user.id,
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

  // create PARTNER BLOG
  create_partner_blog: async (req, res, next) => {
    try {
      const now = common.currentDateTime();
      const { title, description, link, status } = req.body;
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const partner_id = req.user.id;
      await partnerModel

        .create_partner_blog(
          req.file.originalname,
          Config.environment == "local" ? req.file.filename : req.file.key,
          entities.encode(title),
          entities.encode(description),
          entities.encode(link),
          status,
          created_at,
          partner_id
        )

        .then(async function (data) {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Partner blog added succesfully",
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

  get_partner_blog: async (req, res, next) => {
    try {
      await partnerModel
        .get_partner_blog(req.user.id)
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

  forgot_password: async (req, res, next) => {
    try {
      const { email } = req.body;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      const get_user = await partnerModel.get_partner_details(
        entities.encode(email.toLowerCase(), "")
      );
      if (get_user.length > 0) {
        if (get_user[0].status == 0) {
          return res.status(400).json({
            status: 2,
            error: "Your account is inactive. Please contact the sales team.",
          });
        } else {
          if (!!email) {
            var payload = {
              time: new Date().getTime() + 72 * 60 * 60000,
              checksum: email,
            };
            var token = jwtSimple.encode(payload, Config.jwt.secret);
            await commonModel.create_email_token(email, token, "P", created_at);
            var url =
              Config.website.frontend_url + `/reset_partner_password/` + token;
            let mailParam = {
              name: get_user[0].name,
              url: url,
            };
            const mailSent = common.sendMailToPartnerResetPassword(
              "FORGOT_PASSWORD_PARTNER",
              email,
              mailParam
            );
            if (mailSent) {
              return res.status(200).json({
                status: 1,
                message: "Email sent",
              });
            } else {
              return res.status(400).json({
                status: 2,
                message: "Email has not been sent",
              });
            }
          }
        }
      } else {
        return res.status(400).json({
          status: 2,
          error: "No partner found with this email",
        });
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
  reset_password: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const user = {
        password: entities.encode(password),
        token: entities.encode(token),
      };
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
      try {
        var decodedToken = jwtSimple.decode(user.token, Config.jwt.secret);
      } catch (error) {
        return res.status(400).json({
          status: 3,
          message: "Token is invalid",
        });
      }

      let tokenExist = await commonModel.findByUserEmail(
        decodedToken.checksum,
        "P"
      );
      if (tokenExist.length > 0) {
        if (tokenExist[0].token == token) {
          if (decodedToken.time > new Date().getTime()) {
            let password = user.password;
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            let get_user_by_email = await partnerModel.get_partner_by_email(
              decodedToken.checksum
            );
            if (get_user_by_email.length > 0) {
              await partnerModel.reset_partner_password(
                passwordHash,
                decodedToken.checksum,
                updated_at
              );
            } else {
              return res.status(400).json({
                status: 3,
                message:
                  "Partner email not found. Please contact the sales team",
              });
            }

            await commonModel
              .update_email_token(decodedToken.checksum, updated_at, token, "P")
              .then(async function (data) {
                return res.status(200).json({
                  status: 1,
                  message: "Password updated successfully",
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
          } else {
            return res.status(400).json({
              status: 3,
              message: "Token expired please resend link",
            });
          }
        } else {
          return res.status(400).json({
            status: 3,
            message: "This link is already used",
          });
        }
      } else {
        return res.status(400).json({
          status: 3,
          message: "Invalid token",
        });
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
