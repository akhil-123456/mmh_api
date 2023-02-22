const express = require("express");
const adminRouter = require("./adm");
const userController = require("./user");
const websiteController = require("./website");
const partnerController = require("./partner");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/adm",
    route: adminRouter,
  },

  {
    path: "/website",
    route: websiteController,
  },
  {
    path: "/user",
    route: userController,
  },
  {
    path: "/partner",
    route: partnerController,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
module.exports = router;
