const express = require("express");
const router = require("express-promise-router")();
const passport = require("passport");
const passportConf = require("../passport");

const {
  validateBody,
  validateParam,
  schemas,
  schema_posts,
} = require("../helpers/websiteValidate");
// const validateDbBody = require('../helpers/cmsDbValidate');
const websiteController = require("../controllers/website");
const partnerController = require("../controllers/partner");

/**
 * @desc POST Contact Us form
 * @return json
 */
router
  .route("/contact_us")
  .post(validateBody(schemas.contact_us), websiteController.contact_us);

/**
 * @desc Get Cipla Invoice
 * @return json
 */
/**
 * @desc Get featured on images
 * @return json
 */
router.route("/featured_list").get(websiteController.get_featured_list);

/**
 * @desc Get FAQs list
 * @return json
 */

router.route("/faq").get(websiteController.faq_list);

/*
 * @desc Get User Reviews list
 * @return json
 */
router.route("/user_feedback").get(websiteController.review_list);

/**
 * @desc  patner master services
 * @return json
 */
router.route("/master_service").get(websiteController.master_service);

/**
 * @desc  tc_pc_details
 * @return json
 */
router
  .route("/tc_pc_details/:id")
  .get(schema_posts.tc_pc_details, websiteController.tc_pc_details);

/**
 * @desc  get_partner_blog_list
 * @return json
 */
router
  .route("/get_partner_blog/:partner_id")
  .get(websiteController.get_partner_blog_list);

module.exports = router;
