const express = require("express");
const { validateBody, authentication, upload, isFile } = require("../../middlewares");
const { schemas } = require("../../models/user");
const router = express.Router();
const ctrl = require("../../controllers/users");

router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post("/verify", validateBody(schemas.emailSchema), ctrl.resendVerifyEmail)

router.get("/current", authentication, ctrl.getCurrent);

router.post("/logout", authentication, ctrl.logout);

router.patch(
  "/avatars",
  authentication,
  upload.single("avatar"),
  isFile,
  ctrl.updateUserAvatar
);

module.exports = router;
