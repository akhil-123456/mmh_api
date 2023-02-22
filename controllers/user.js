const JWT = require("jsonwebtoken");
const jwtSimple = require("jwt-simple");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const bcrypt = require("bcryptjs");
const userModel = require("../models/user");
const commonModel = require("../models/common");
const Config = require("../configuration/config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(Config.cryptR.secret);
const common = require("./common");
const globalLimit = 20;
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
UserloginToken = (user_data) => {
  return JWT.sign(
    {
      iss: "MMH",
      sub: user_data.user_id,
      name: user_data.name,
      email: user_data.email,
      user_type: user_data.user_type,
      ag: user_data.user_agent,
      iat: Math.round(new Date().getTime() / 1000),
      exp: Math.round(new Date().getTime() / 1000) + 24 * 60 * 60,
    },
    Config.jwt.secret
  );
};

module.exports = {
  user_handle_auth: async (req, res, next) => {
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
      const get_user = await userModel.get_user_details(
        !!email ? entities.encode(email.toLowerCase()) : "",
        !!phone ? phone : ""
      );
      if (get_user.length > 0) {
        if (get_user[0].status == 0) {
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
            await commonModel.create_otp(phone, otp, created_at, "U", 1);
            return res.status(200).json({
              status: 1,
              otp: otp,
              user_type: "OLD",
            });
          }
        }
      } else {
        ////////////////NEW USER////////////////
        if (!!email) {
          var payload = {
            time: new Date().getTime() + 72 * 60 * 60000,
            checksum: email,
          };
          var token = jwtSimple.encode(payload, Config.jwt.secret);
          await commonModel.create_email_token(email, token, "U", created_at);
          var url = Config.website.frontend_url + `/verify_user_email/` + token;

          let mailParam = {
            url: url,
          };
          const mailSent = common.sendMailToUserVerify(
            "VERIFY_EMAIL",
            email,
            mailParam
          );
          if (mailSent) {
            return res.status(200).json({
              status: 1,
              message: "Email sent",
              user_type: "NEW",
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
          await commonModel.create_otp(phone, otp, created_at, "U", 1);

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
        const get_user = await userModel.get_user(req.body.phone);
        if (get_user.length > 0) {
          let user_data = {
            user_id: cryptr.encrypt(get_user[0].id),
            name: get_user[0].name,
            phone: get_user[0].phone,
            email: get_user[0].email,
            user_type: "U",
            user_agent: cryptr.encrypt(req.get("User-Agent")),
          };
          const token = UserloginToken(user_data);

          res.status(200).json({ status: 1, token: token });
        } else {
          return res.status(400).json({
            staus: 2,
            message: "Invalid user type",
          });
        }
      } else {
        await commonModel
          .update_otp(req.body.phone, req.body.otp, created_at, "U")
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
      const get_user = await userModel.get_user_details(
        "",
        !!phone ? phone : ""
      );
      if (get_user.length > 0) {
        if (get_user[0].status == 0) {
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
            await commonModel.create_otp(phone, otp, created_at, "U", 1);
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
          await commonModel.create_otp(phone, otp, created_at, "U", 1);

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
        "U"
      );
      if (tokenExist.length > 0) {
        if (tokenExist[0].token == token) {
          if (decodedToken.time > new Date().getTime()) {
            let password = user.password;
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            let get_user_by_email = await userModel.get_user_by_email(
              decodedToken.checksum
            );
            if (get_user_by_email.length > 0) {
              await userModel.update_user_password(
                entities.encode(name),
                passwordHash,
                decodedToken.checksum,
                created_at,
                1
              );
            } else {
              await userModel.create_user_email(
                entities.encode(name),
                passwordHash,
                decodedToken.checksum,
                created_at,
                1
              );
            }

            await commonModel
              .update_email_token(decodedToken.checksum, created_at, token, "U")
              .then(async function (data) {
                const get_user_by_email = await userModel.get_user_by_email(
                  decodedToken.checksum
                );

                if (get_user_by_email.length > 0) {
                  let user_data = {
                    user_id: cryptr.encrypt(get_user_by_email[0].id),
                    name: get_user_by_email[0].name,
                    phone: get_user_by_email[0].phone,
                    email: get_user_by_email[0].email,
                    user_type: "U",
                    user_agent: cryptr.encrypt(req.get("User-Agent")),
                  };
                  const token = UserloginToken(user_data);

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

  check_email_password: async (req, res, next) => {
    if (
      Number.isInteger(req.user.id) &&
      req.user.id > 0 &&
      req.body.user_type == "OLD"
    ) {
      let user_data = {
        user_id: cryptr.encrypt(req.user.id),
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        user_type: "U",
        user_agent: cryptr.encrypt(req.get("User-Agent")),
      };
      const token = UserloginToken(user_data);

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
        const get_user = await userModel.get_user(phone);
        if (get_user.length == -0) {
          await userModel.create_user_phone(
            entities.encode(name),
            phone,
            created_at,
            1
          );
          const get_user_by_phone = await userModel.get_user(phone);

          if (get_user_by_phone.length > 0) {
            let user_data = {
              user_id: cryptr.encrypt(get_user_by_phone[0].id),
              name: get_user_by_phone[0].name,
              phone: get_user_by_phone[0].phone,
              email: get_user_by_phone[0].email,
              user_type: "U",
              user_agent: cryptr.encrypt(req.get("User-Agent")),
            };
            const token = UserloginToken(user_data);

            res.status(200).json({
              status: 1,
              message: "User registered successfully",
              token: token,
            });
          } else {
            return res.status(400).json({
              status: 3,
              message: "User not found",
            });
          }
        } else {
          return res.status(400).json({
            status: 3,
            message: "User already registered",
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

  get_wishlist: async (req, res, next) => {
    try {
      if (req.query.page && req.query.page > 0) {
        var page = req.query.page;
        var limit = globalLimit;
        var offset = (page - 1) * globalLimit;
      } else {
        var limit = globalLimit;
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

      await userModel
        .get_wishlist(
          req.user.id,
          entities.encode(search_text.toLowerCase()),
          start_date,
          end_date,
          entities.encode(status),
          limit,
          offset
        )
        .then(async function (data) {
          let count = await userModel.wishlist_count(
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

  get_book_partner: async (req, res, next) => {
    try {
      if (req.query.page && req.query.page > 0) {
        var page = req.query.page;
        var limit = globalLimit;
        var offset = (page - 1) * globalLimit;
      } else {
        var limit = globalLimit;
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

      await userModel
        .get_book_partner(
          req.user.id,
          entities.encode(search_text.toLowerCase()),
          start_date,
          end_date,
          entities.encode(status),
          limit,
          offset
        )
        .then(async function (data) {
          let count = await userModel.book_partner_count(
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
        "U"
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

  add_wishlist: async (req, res, next) => {
    try {
      const { partner_id } = req.params;
      const user_id = req.user.id;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await userModel
        .add_wishlist(user_id, partner_id, created_at, 1)
        .then((data) => {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Partner added to wishlist",
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
  delete_wishlist: async (req, res, next) => {
    try {
      const { partner_id } = req.params;
      const user_id = req.user.id;
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await userModel
        .delete_wishlist(user_id, partner_id, updated_at)
        .then((data) => {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Partner removed from wishlist",
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
  book_partner: async (req, res, next) => {
    try {
      const { partner_id } = req.body;
      const user_id = req.user.id;
      const now = common.currentDateTime();
      const created_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      const dataPosted = await userModel.book_partner(
        user_id,
        partner_id,
        created_at,
        1
      );
      const partner_details = await commonModel.getPartnerDetails(partner_id);
      const user_details = await userModel.findByUserId(user_id);

      let mailParam = {
        partner_name: partner_details[0].name,
        user_name: user_details[0].name,
        user_email: user_details[0].email,
        user_phone: user_details[0].phone,
      };

      if (!!dataPosted) {
        await common
          .sendBookingConfirmToPartner(
            "BOOK_PARTNER",
            partner_details[0].email != null
              ? partner_details[0].email
              : "inderit.singh@mapmyhouse.com",
            mailParam,
            "P"
          )
          .then((data) => {
            return res.status(200).json({
              status: 1,
              message: "Email sent, Booking Confirmed",
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
  cancel_booking: async (req, res, next) => {
    try {
      const { partner_id } = req.body;
      const user_id = req.user.id;
      const now = common.currentDateTime();
      const updated_at = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      await userModel
        .cancel_booking(user_id, partner_id, updated_at)
        .then((data) => {
          res
            .status(200)
            .json({
              status: 1,
              data: data,
              message: "Partner booking cancelled",
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
      const get_user = await userModel.get_user_details(
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
            await commonModel.create_email_token(email, token, "U", created_at);
            var url =
              Config.website.frontend_url + `/reset_user_password/` + token;
            console.log("get_user[0].name,>>>", get_user[0].name);
            let mailParam = {
              name: get_user[0].name,
              url: url,
            };
            const mailSent = common.sendMailToUserResetPassword(
              "FORGOT_PASSWORD_USER",
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
          error: "No user found with this email",
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
        "U"
      );
      if (tokenExist.length > 0) {
        if (tokenExist[0].token == token) {
          if (decodedToken.time > new Date().getTime()) {
            let password = user.password;
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            let get_user_by_email = await userModel.get_user_by_email(
              decodedToken.checksum
            );
            if (get_user_by_email.length > 0) {
              await userModel.reset_user_password(
                passwordHash,
                decodedToken.checksum,
                updated_at
              );
            } else {
              return res.status(400).json({
                status: 3,
                message: "User email not found. Please contact the sales team",
              });
            }

            await commonModel
              .update_email_token(decodedToken.checksum, updated_at, token, "U")
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
