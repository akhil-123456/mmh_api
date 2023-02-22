const router = require("express-promise-router")();
const passport = require("passport");
const passportConf = require("../passport");

const {
  validateBody,
  validateParam,
  schemas,
  schema_posts,
} = require("../helpers/userValidate");
const validateDbBody = require("../helpers/userDbValidate");
const userController = require("../controllers/user");
const userPassportJWT = passport.authenticate("jwtUser", { session: false });
const passportSignIn = passport.authenticate("localUser", {
  session: false,
});

/**
 * @desc Normal Login for user
 * @return json
 */
router
  .route("/login")
  .post(
    validateBody(schemas.authSchema),
    validateDbBody.check_user,
    userController.login
  );

/**
 * @desc Normal validating otp for user
 * @return json
 */
router
  .route("/validate_otp")
  .post(
    validateBody(schemas.validate_otp),
    validateDbBody.validate_otp,
    userController.validate_otp
  );

/**
 * @desc Resend otp for user
 * @return json
 */
router
  .route("/resend_otp")
  .post(
    validateBody(schemas.resend_otp),
    validateDbBody.resend_otp,
    userController.resend_otp
  );
/**
 * @desc Verify new link of a new user
 * @return json
 */
router
  .route("/verify_email_token")
  .post(
    validateBody(schemas.verify_email_token),
    userController.verify_email_token
  );

/**
 * @desc Verify email of a new user
 * @return json
 */
router
  .route("/verify_email")
  .post(validateBody(schemas.verify_email), userController.verify_email);

/**
 * @desc Check email password
 * @return json
 */
router
  .route("/check_email_password")
  .post(
    validateBody(schemas.check_email_password),
    passportSignIn,
    userController.handle_login,
    userController.check_email_password
  );

/**
 * @desc Register user with number
 * @return json
 */
router
  .route("/register_by_num")
  .post(
    validateBody(schemas.register_by_num),
    validateDbBody.register_by_num,
    userController.register_by_num
  );

/**
 * @desc Forgot password/resetting password of a user
 * @return json
 */

router
  .route("/forgot_password")
  .post(validateBody(schemas.forgot_password), userController.forgot_password);

/**
 * @desc Reseting password of a user after clicking on resetting link
 * @return json
 */

router
  .route("/reset_password")
  .post(validateBody(schemas.reset_password), userController.reset_password);

/**
 * @desc Get user's wishlist
 * @return json
 */
router
  .route("/get_wishlist")
  .get(
    userPassportJWT,
    userController.user_handle_auth,
    userController.get_wishlist
  );

/**
 * @desc Add partner to a user's wishlist
 * @return json
 */
router
  .route("/add_wishlist/:partner_id")
  .post(
    userPassportJWT,
    userController.user_handle_auth,
    validateParam(schemas.partner_id),
    validateDbBody.add_wishlist,
    userController.add_wishlist
  );

/**
 * @desc Delete partner from a user's wishlist
 * @return json
 */
router
  .route("/delete_wishlist/:partner_id")
  .post(
    userPassportJWT,
    userController.user_handle_auth,
    validateParam(schemas.partner_id),
    validateDbBody.delete_wishlist,
    userController.delete_wishlist
  );

/**
 * @desc Book partner
 * @return json
 */
router
  .route("/book_partner/")
  .post(
    userPassportJWT,
    userController.user_handle_auth,
    validateBody(schemas.partner_id),
    validateDbBody.book_partner,
    userController.book_partner
  );

/**
 * @desc Cancel booking partner
 * @return json
 */
router
  .route("/cancel_booking/")
  .post(
    userPassportJWT,
    userController.user_handle_auth,
    validateBody(schemas.partner_id),
    validateDbBody.cancel_booking,
    userController.cancel_booking
  );

/**
 * @desc Get user's book partner
 * @return json
 */
router
  .route("/get_book_partner")
  .get(
    userPassportJWT,
    userController.user_handle_auth,
    userController.get_book_partner
  );
module.exports = router;
