const express = require("express");
const router = require("express-promise-router")();
const passport = require("passport");
const passportConf = require("../passport");
const common = require("../controllers/common");
const admController = require("../controllers/adm");

const {
  validateBody,
  validateParam,
  schemas,
  schema_posts,
} = require("../helpers/admValidate");
const validateDbBody = require("../helpers/admDbValidate");

const passportSignIn = passport.authenticate("localAdm", { session: false });
const passportJWT = passport.authenticate("jwtAdm", { session: false });

/**
 * @desc Admin Login Api
 * @return json
 */

router
  .route("/login")
  .post(
    validateBody(schemas.authSchema),
    passportSignIn,
    admController.handle_login,
    admController.login
  ); // Checked

/**
 * @desc Get all contact us listing in Admin
 * @return json
 */
router
  .route("/contact_us")
  .get(passportJWT, common.common_handle_auth_admin, admController.contact_us);

/**
 * @desc Get delete a contact us
 * @return json
 */
router
  .route("/contact_us/:contact_id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.contact_reply_id),
    schema_posts.contact_id,
    admController.delete_contact_us
  );

/**
 * @desc Reply to a contact enquiry
 * @return json
 */
router
  .route("/reply_query/:contact_id")
  .post(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.contact_reply_id),
    validateBody(schemas.reply_query),
    schema_posts.contact_id,
    admController.reply_query
  );

/**
 * @desc Add featured on images
 * @return json
 */
router
  .route("/featured_list")
  .post(
    passportJWT,
    common.common_handle_auth_admin,
    schema_posts.add_featured_image,
    admController.create_featured_image
  );

/**
 * @desc Get featured on images
 * @return json
 */
router
  .route("/featured_list")
  .get(
    passportJWT,
    common.common_handle_auth_admin,
    admController.get_featured_list
  );

/**
 * @desc Delete featured  images
 * @return json
 */
router
  .route("/featured_list/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    admController.delete_featured_image
  );

/**
 * @desc Change status of featured image
 * @return json
 */
router
  .route("/change_status_featured_image/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.change_status),
    admController.change_status_featured_image
  );

/**
 * @desc Create FAQs
 * @return json
 */
router
  .route("/faq")
  .post(
    passportJWT,
    common.common_handle_auth_admin,
    validateBody(schemas.faq),
    admController.create_faq
  );

/**
 * @desc Get FAQs list
 * @return json
 */
router
  .route("/faq")
  .get(passportJWT, common.common_handle_auth_admin, admController.faq_list);

/**
 * @desc Update FAQ
 * @return json
 */
router
  .route("/update_faq/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.faq),
    admController.update_faq
  );

/**
 * @desc Change status of faq +
 * @return json
 */
router
  .route("/change_status_faq/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.change_status),
    admController.change_status_faq
  );

/**
 * @desc Delete faq
 * @return json
 */
router
  .route("/faq/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    admController.delete_faq
  );

/**
 * @desc Add user feedback
 * @return json
 */
router
  .route("/user_feedback")
  .post(
    passportJWT,
    common.common_handle_auth_admin,
    schema_posts.add_review_image,
    admController.create_user_feedback
  );

/**
 * @desc Get User Reviews list
 * @return json
 */
router
  .route("/user_feedback")
  .get(passportJWT, common.common_handle_auth_admin, admController.review_list);

/**
 * @desc Change status of user review
 * @return json
 */
router
  .route("/change_status_review/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.change_status),
    admController.change_status_review
  );

/**
 * @desc Delete User Review
 * @return json
 */
router
  .route("/user_feedback/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    admController.delete_user_feedback
  );

/**
 * @desc updated user feedback
 * @return json
 */
router
  .route("/update_user_feedback/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    schema_posts.add_review_image,
    admController.update_user_feedback
  );

/**
 * @desc Get Users list
 * @return json
 */
router
  .route("/user_list")
  .get(passportJWT, common.common_handle_auth_admin, admController.user_list);

/**
 * @desc Delete Users list
 * @return json
 */
router
  .route("/user_list/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    admController.delete_user
  );

/**
 * @desc Update User Details
 * @return json
 */
router
  .route("/update_user/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.update_user),
    validateDbBody.update_user,
    admController.update_user
  );
/**
 * @desc price
 * @return json
 */
router
  .route("/price")
  .get(passportJWT, common.common_handle_auth_admin, admController.price_list);

/**
 * @desc Update price
 * @return json
 */
router
  .route("/update_price/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.price),
    admController.update_price
  );

/**
 * @desc Get featured on images
 * @return json
 */
router
  .route("/tc_pc_list")
  .get(
    passportJWT,
    common.common_handle_auth_admin,
    admController.get_tc_pp_list
  );
/**
 * @desc Get featured on images
 * @return json
 */
router
  .route("/tc_pc_details/:id")
  .get(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    schema_posts.tc_pc_id,
    admController.tc_pc_details
  );

/**
 * @desc updated user feedback
 * @return json
 */
router
  .route("/tc_pc_list/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    schema_posts.add_tc_pc_image,
    admController.update_tc_pp
  );

/////////////////////////SUB-ADMIN SECTION START/////////////////////////

/**
 * @desc Get subadmin list
 * @return json
 */
router
  .route("/sub_admin")
  .get(
    passportJWT,
    common.common_handle_auth_admin,
    admController.get_sub_admin
  );

/**
 * @desc Create subadmin
 * @return json
 */
router
  .route("/sub_admin")
  .post(
    passportJWT,
    common.common_handle_auth_admin,
    validateBody(schemas.sub_admin),
    schema_posts.add_sub_admin,
    admController.add_sub_admin
  );

/**
 * @desc Update subadmin
 * @return json
 */
router
  .route("/sub_admin/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.sub_admin),
    schema_posts.update_sub_admin,
    admController.update_sub_admin
  );

/**
 * @desc Delete subadmin
 * @return json
 */
router
  .route("/delete_sub_admin/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    schema_posts.delete_sub_admin,
    admController.delete_sub_admin
  );

/**
 * @desc Change status of subadmin
 * @return json
 */
router
  .route("/change_status_sub_admin/:id")
  .put(
    passportJWT,
    common.common_handle_auth_admin,
    validateParam(schemas.record_id),
    validateBody(schemas.change_status),
    schema_posts.delete_sub_admin,
    admController.change_status_sub_admin
  );

/////////////////////////SUB-ADMIN SECTION END/////////////////////////

module.exports = router;
