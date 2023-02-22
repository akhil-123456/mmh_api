const nodemailer = require("nodemailer");
const moment = require("moment");
const dateFormat = require("dateformat");
const dateMath = require("date-arithmetic");
const fs = require("fs");
const Config = require("../configuration/config");
const axios = require("axios");
const email_logo = require("../configuration/config");
var today = moment().format("YYYY-MM-DD");

const errorLogFile = Config.errorFileName;
var transportConfig = Config.transportConfig;
var transportConfigNoReply = Config.transportConfigNoReply;

const transporterNEW = nodemailer.createTransport(transportConfig);
const CAN_MAIL = true;

let mime_obj = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".rtf": "application/rtf",
  ".wpd": "application/vnd.wordperfect",
  ".tex": "application/x-tex",
  ".wks": "application/vnd.ms-works",
  ".wps": "application/vnd.ms-works",
  ".xlr": "application/vnd.ms-excel",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".csv": "text/csv",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pps": "application/vnd.ms-powerpoint",
  ".key": "application/octet-stream",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ai": "application/postscript",
  ".bmp": "image/bmp",
  ".ico": "image/vnd.microsoft.icon",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".eml": "message/rfc822",
};

module.exports = {
  dateValidation: (req, res, next) => {
    try {
      let err = {};
      const { start_date, end_date } = req.query;
      if (start_date != "" && end_date != "") {
        if (
          new Date(start_date) != "Invalid Date" &&
          new Date(end_date) != "Invalid Date"
        ) {
          if (new Date(start_date) > new Date(end_date)) {
            err.date_search = "Start date can not greater than end date";
          }
        } else {
          err.date_search = "Invalid date";
        }
      } else {
        if (new Date(start_date) == "Invalid Date" && start_date != "") {
          err.date_search = "Invalid date";
        }
        if (new Date(end_date) == "Invalid Date" && end_date != "") {
          err.date_search = "Invalid date";
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
  currentDate: () => {
    var now = module.exports.calcTime();

    return dateFormat(now, "yyyy-mm-dd");
  },
  currentTime: () => {
    var now = module.exports.calcTime();

    return dateFormat(now, "HH:MM:ss");
  },
  currentDateTime: () => {
    var now = module.exports.calcTime();

    return dateFormat(now, "yyyy-mm-dd HH:MM:ss");
  },

  changeDateFormat: (date, separator, format) => {
    // format dd.mm.yyyy || mm.dd.yyyy
    var match = format.split(".");
    return dateFormat(
      date,
      `${match[0]}${separator}${match[1]}${separator}${match[2]}`
    );
  },
  formatDate: (input_date, new_format) => {
    return dateFormat(input_date, new_format);
  },
  dayCountExcludingWeekends: (total_sla) => {
    var now_date = module.exports.calcTime();
    var due_date = module.exports.calcTime();
    var allocated_days = total_sla;
    var days_taken = 0;

    for (var i = 1; i < 160; i++) {
      if (days_taken >= allocated_days) {
        break;
      }
      due_date = dateMath.add(now_date, i, "day");
      if (
        dateFormat(due_date, "ddd") == "Sat" ||
        dateFormat(due_date, "ddd") == "Sun"
      ) {
      } else {
        days_taken++;
      }
    }

    return i - 1;
  },
  nextDate: (value, unit) => {
    var unitArr = [
      "milliseconds",
      "second",
      "minutes",
      "hours",
      "day",
      "weekday",
      "month",
      "year",
      "decade",
      "century",
    ];

    if (unitArr.indexOf(unit) == "-1") {
      var e = new Error("Invalid unit given.");
      return e;
    }

    if (value <= 0) {
      var e = new Error("Invalid days given.");
      return e;
    }

    var date = module.exports.calcTime();

    return dateMath.add(date, value, unit);
  },
  logError: (err) => {
    //console.log("Error from common === SATYAJIT =====>", err);

    var matches = err.stack.split("\n");
    var regex1 = /\((.*):(\d+):(\d+)\)$/;
    var regex2 = /(.*):(\d+):(\d+)$/;
    var errorArr1 = regex1.exec(matches[1]);
    var errorArr2 = regex2.exec(matches[1]);
    if (errorArr1 !== null || errorArr2 !== null) {
      var errorText = matches[0];
      if (errorArr1 !== null) {
        var errorFile = errorArr1[1];
        var errorLine = errorArr1[2];
      } else if (errorArr2 !== null) {
        var errorFile = errorArr2[1];
        var errorLine = errorArr2[2];
      }

      var now = module.exports.calcTime();
      var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

      var errMsg = `\n DateTime: ${date_format} \n ${errorText} \n Line No : ${errorLine} \n File Path: ${errorFile} \n`;

      var errHtml = `<!DOCTYPE html><html><body><p>${errorText}</p><p>Line No : ${errorLine}</p><p>File Path: ${errorFile}</p></body></html>`;

      //LOG ERR
      fs.appendFile(errorLogFile, errMsg, (err) => {
        if (err) throw err;
        //console.log('The file has been saved!');
      });
      //LOG ERR

      //SEND MAIL
      var toArr = [
        //  "soumyadeep@indusnet.co.in",
        Config.webmasterMail,
      ];
      var mailOptions = {
        from: Config.webmasterMail,
        to: toArr,
        subject: `Error In ${Config.website.backend_url}`,
        html: errHtml,
      };
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log("err", err);
        } else {
          console.log(info);
        }
      });
      //SEND MAIL
    }
  },
  trimSpaces: (str) => {
    return str ? str.trim().replace(/\s+/g, " ") : "";
  },
  lowerTrimWs: (str) => {
    return str ? str.trim().toLowerCase() : "";
  },
  getErrorText: (err) => {
    console.log({ err });
    var matches = err.stack.split("\n");
    return matches[0];
  },
  // mail to success of cron
  logCronSuccess: (message) => {
    //console.log("Error from common === SATYAJIT =====>", err);

    var now = module.exports.calcTime();
    var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

    var successMessage = `\n DateTime: ${date_format} \n ${message}\n`;

    var succHTML = `<!DOCTYPE html><html><body><p>${message}</p></body></html>`;

    //SEND MAIL
    var toArr = [
      //  "soumyadeep@indusnet.co.in",
      "inderjit.singh@mapmyhouse.com",
    ];
    var mailOptions = {
      from: Config.webmasterMail,
      to: toArr,
      subject: `Successfully Cron Updated in ${Config.website.backend_url}`,
      html: succHTML,
    };
    var transporter = nodemailer.createTransport(transportConfig);
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log("err", err);
      } else {
        console.log(info);
      }
    });
    //SEND MAIL
  },
  asyncForEach: async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  },
  sendMail: (mailOptions) => {
    if (mailOptions.to && mailOptions.to != "") {
      console.log("mailOptions", mailOptions);
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
      });
    }
  },
  sendMailB2C: (mailOptions) => {
    if (mailOptions.to && mailOptions.to != "") {
      var transporter = nodemailer.createTransport(transportConfigNoReply);
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
      });
    }
  },

  admin_user_query_reply: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[MESSAGE]", mailParams.message);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "U",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },
  sendMailToUserVerify: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[URL]", mailParams.url);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "U",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },
  sendMailToUserResetPassword: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[URL]", mailParams.url);
      mailHtml = mailHtml.replace("[NAME]", mailParams.name);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "U",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },
  sendMailToPartnerResetPassword: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[URL]", mailParams.url);
      mailHtml = mailHtml.replace("[NAME]", mailParams.name);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "P",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },
  sendMailToPartnerVerify: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[URL]", mailParams.url);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "P",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },
  sendMailToNewSubAdmin: async (mailCode, mailTo, mailParams) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject;
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };

      mailHtml = mailHtml.replace("[NAME]", mailParams.full_name);
      mailHtml = mailHtml.replace("[USERNAME]", mailParams.username);
      mailHtml = mailHtml.replace("[PASSWORD]", mailParams.password);

      var user_type = "S";
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "SUB",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },

  sendContactMailToAdmin: async (
    mailCode,
    mailTo,
    mailFrom,
    mailParams,
    created_at,
    contact_message,
    user_id,
    user_type
    // order_id
  ) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");

      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.order_email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var sub = mailSubject.replace("[NAME]", mailParams);
      var mailHtml = entities.decode(mailData[0].content);
      var str_array = mailData[0].params.split(",");
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };
      mailHtml = mailHtml.replace("[NAME]", mailParams);
      mailHtml = mailHtml.replace("[EMAIL]", Config.webmasterMail);
      mailHtml = mailHtml.replace("[MESSAGEHTML]", contact_message);
      mailHtml = mailHtml.replace("[IMG_URL]", email_logo.website.email_logo);
      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: sub, // "Employee Contact us",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            user_type,
            "A",
            sub,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },

  sendBookingConfirmToPartner: async (
    mailCode,
    mailTo,
    mailParams,
    user_type
  ) => {
    if (mailTo && mailTo != "" && CAN_MAIL) {
      const emailModel = require("../models/email_template");
      const cmsModel = require("../models/cms");
      const Entities = require("html-entities").AllHtmlEntities;
      const entities = new Entities();
      let mailData = await emailModel.email_template(mailCode);
      var mailSubject = entities.decode(mailData[0].subject);
      var mailHtml = entities.decode(mailData[0].content);
      RegExp.quote = function (str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      };
      mailHtml = mailHtml.replace("[PARTNER_NAME]", mailParams.partner_name);
      mailHtml = mailHtml.replace("[USER_NAME]", mailParams.user_name);
      mailHtml = mailHtml.replace(
        "[USER_PHONE]",
        mailParams.user_phone != null ? mailParams.user_phone : "NA"
      );
      mailHtml = mailHtml.replace(
        "[USER_EMAIL]",
        mailParams.user_email != null ? mailParams.user_email : "NA"
      );

      var mailOptions = {
        from: Config.webmasterMail, //Config.webmasterMail,
        to: mailTo,
        subject: mailSubject, // "New booking made",
        html: mailHtml,
      };
      var mailCc = "";
      var transporter = nodemailer.createTransport(transportConfig);
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Template mail send to: " + mailTo);

          var now = module.exports.calcTime();
          var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");
          await cmsModel.emailSendLog(
            mailCode,
            Config.webmasterMail,
            mailTo,
            "S",
            user_type,
            mailSubject,
            mailHtml,
            date_format,
            mailCc
          );
          console.log("MailLog uploaded");
        }
      });

      return true;
    }
  },

  checkUniqueArr: (a) => {
    var counts = [];
    for (var i = 0; i <= a.length; i++) {
      if (counts[a[i]] === undefined) {
        counts[a[i]] = 1;
      } else {
        return true;
      }
    }
    return false;
  },
  isEmptyObj: (obj) => {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  },

  inArray: (needle, haystack) => {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
      if (haystack[i] == needle) return true;
    }
    return false;
  },
  equalArrays: (array1, array2) => {
    var a = array1.sort();
    var b = array2.sort();

    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (a.length != b.length) {
      return false;
    }

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  },
  logErrorText: (custom_text, error_text) => {
    var now = module.exports.calcTime();
    var date_format = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

    var errMsg = `\n DateTime: ${date_format} \n ${error_text} \n ${custom_text} \n`;
    //LOG ERR
    fs.appendFile(errorLogFile, errMsg, (err) => {
      if (err) throw err;
      //console.log('Error has been logged!');
    });
    //LOG ERR
  },
  calcTime: () => {
    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + 3600000 * 5.5);

    // return time as a string
    return nd;
  },
  calcInputTime: (valu) => {
    // create Date object for current location
    var d = new Date(valu);

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime();

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + 3600000 * 5.5);

    // return time as a string
    return nd;
  },
  get_mime_type: (extention) => {
    let keys_arr = Object.keys(mime_obj);

    if (module.exports.inArray(extention, keys_arr)) {
      return mime_obj[extention];
    } else {
      return "";
    }
  },
  check_extension: (extention) => {
    let keys_arr = Object.keys(mime_obj);
    //console.log(keys_arr);
    if (module.exports.inArray(extention, keys_arr)) {
      return true;
    } else {
      return false;
    }
  },
  get_extensions: () => {
    let keys_arr = Object.keys(mime_obj);
    return keys_arr;
  },

  common_handle_auth: async (req, res, next) => {
    //console.log("this is user ::",req.user);
    if (req.get("User-Agent") == req.user.ag) {
      if (req.user.type == "D" || req.user.type == "E") {
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
  common_handle_auth_admin: async (req, res, next) => {
    if (req.get("User-Agent") == req.user.ag) {
      if (req.user.admin_type == "S" || req.user.admin_type == "S") {
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
};
