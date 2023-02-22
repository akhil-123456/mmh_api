const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");

const routes = require("./routes/index");

const Config = require("./configuration/config");
const common = require("./controllers/common");
const nocache = require("nocache");
const helmet = require("helmet");
const frameguard = require("frameguard");

const app = express();

// Remove the X-Powered-By headers.
app.disable("x-powered-by");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "/uploads")));
app.use(express.static(path.join(__dirname, "/download")));
app.use(express.static(path.join(__dirname, "/uploads/po_order")));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true })); //SVJT FOR OUTLOOKs
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.disable("etag");
app.use(nocache());
app.use(helmet.noSniff());
app.use(frameguard());
app.use(helmet.xssFilter());
app.use(helmet.hsts());

app.get("/", async (req, res) => {
  return res.send({
    success: true,
    message: "Welcome",
  });
});

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  if (process.env.NODE_ENV == "production") {
    const allowedOrigins = ["https://alkem.indusnettechnologies.com"];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Authorization"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.use("/api", routes);

app.use(function (req, res, next) {
  // console.log( req, res, next )
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  //res.locals.message = err.message;
  //res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  console.log("err", err);

  // 	common.sendMail({
  //     from   : Config.webmasterMail, // sender address
  //     to     : 'inderjit.singh@indusnet.co.in', // list of receivers
  //     subject: `URL || ${Config.website.backend_url} || Site Error`, // Subject line
  //     html   : `Error: ${JSON.stringify(err)} Url: ${req.path}`// plain text body
  //   });

  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = app;
