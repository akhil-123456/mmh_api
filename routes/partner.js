const router = require("express-promise-router")();
const passport = require("passport");
const common = require("../controllers/common");
const passportConf = require("../passport");

const {
  validateBody,
  validateParam,
  schemas,
  schema_posts,
} = require("../helpers/partnerValidate");
const validateDbBody = require("../helpers/partnerDbValidate");
const partnerController = require("../controllers/partner");
const partnerPassportJWT = passport.authenticate("jwtPartner", {
  session: false,
});
const passportSignIn = passport.authenticate("localPartner", {
  session: false,
});

const passportGoogle = passport.authenticate("jwtGoogle", {
  scope: ["email", "profile"],
});

/**
 * @desc Normal Login for partner
 * @return json //OK//
 */
router
  .route("/login")
  .post(
    validateBody(schemas.authSchema),
    validateDbBody.check_partner,
    partnerController.login
  );

/**
 * @desc Normal validating otp for partner
 * @return json
 */
router
  .route("/validate_otp")
  .post(
    validateBody(schemas.validate_otp),
    validateDbBody.validate_otp,
    partnerController.validate_otp
  );

/**
 * @desc Resend otp for partner
 * @return json //OK//
 */
router
  .route("/resend_otp")
  .post(
    validateBody(schemas.resend_otp),
    validateDbBody.resend_otp,
    partnerController.resend_otp
  );
/**
 * @desc Verify email for partner
 * @return json //OK//
 */
router
  .route("/verify_email")
  .post(validateBody(schemas.verify_email), partnerController.verify_email);

/**
 * @desc Check email password
 * @return json //OK//
 */
router
  .route("/check_email_password")
  .post(
    validateBody(schemas.check_email_password),
    passportSignIn,
    partnerController.handle_login,
    partnerController.check_email_password
  );

/**
 * @desc Register partner with number
 * @return json
 */
router
  .route("/register_by_num")
  .post(
    validateBody(schemas.register_by_num),
    validateDbBody.register_by_num,
    partnerController.register_by_num
  );

/**
 * @desc Verify new link of a new user
 * @return json
 */
router
  .route("/verify_email_token")
  .post(
    validateBody(schemas.verify_email_token),
    partnerController.verify_email_token
  );

/**
 * @desc Forgot password/resetting password of a partner
 * @return json
 */

router
  .route("/forgot_password")
  .post(
    validateBody(schemas.forgot_password),
    partnerController.forgot_password
  );

/**
 * @desc Reseting password of a partner after clicking on resetting link
 * @return json
 */

router
  .route("/reset_password")
  .post(validateBody(schemas.reset_password), partnerController.reset_password);

/**
 * @desc Add partner service
 * @return json ////////////////NEED TO CHECK/////////////
 */
router
  .route("/partner_signup")
  .post(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    schema_posts.add_partner_image,
    partnerController.create_partner
  );

/**
 * @desc Get partner details when a partner fills all the details
 * @return json
 */
router
  .route("/partner_details")
  .get(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    partnerController.get_partner_details
  );

/**
 * @desc Get partner's bookings
 * @return json
 */
router
  .route("/get_bookings")
  .get(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    partnerController.get_bookings
  );

/**
 * @desc Get partner's and user queries
 * @return json
 */
router
  .route("/get_user_queries")
  .get(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    partnerController.get_user_queries
  );

/**
 * @desc Add partner blog on images
 * @return json
 */
router
  .route("/partner_blog")
  .post(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    schema_posts.partner_blog_image,
    partnerController.create_partner_blog
  );

/**
 * @desc Get partner blog
 * @return json
 */
router
  .route("/get_partner_blog")
  .get(
    partnerPassportJWT,
    partnerController.partner_handle_auth,
    partnerController.get_partner_blog
  );

////////////////////GOOGLE LOGIN START////////////////////////

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};

// app.get("/", (req, res) => {
//     res.send("You are not logged in!");
// });

router.get("/check_google", passportGoogle);

router.get("/failure", (req, res) => {
  res.send("Failed to login");
});

router.get("/successGoogle", isLoggedIn, (req, res) => {
  res.status(200).send(`Token: ${req.user}`);
});

router.get("/myProfile", isLoggedIn, (req, res) => {
  res.status(200).send(`Name: ${req.user.displayName}!`);
});

router.get(
  "/callback",
  passport.authenticate("jwtGoogle", {
    failureRedirect: "/failure",
  }),
  (req, res) => {
    res.redirect("/api/partner/successGoogle");
  }
);

router.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
});

/////////////////////GOOGLE LOGIN END//////////////////////

module.exports = router;
