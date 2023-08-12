const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const gravatar = require("gravatar");
const path = require("path");
const { ctrlWrapper } = require("../utils/ctrlWrapper");
const { HttpError } = require("../utils");
const fs = require("fs/promises");
const { sendEmail } = require("../utils");

const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { SECRET_KEY, BASE_URL } = process.env;
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    // Проверяем есть ли пользователь с таким емейлом
    throw HttpError(409, "This email address is already being used");
  }

  const hashPassword = await bcrypt.hash(password, 10); // Хешируем пароль
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a href="${BASE_URL}/users/verify/${verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  console.log(avatarURL);
  console.log(newUser);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      // avatarURL: newUser.avatarURL,
    },
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  console.log(req.params);
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });
  res.json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  // const { verificationToken } = req.params;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a href="${BASE_URL}/users/verify/${user.verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verification email sent",
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Проверяем есть ли пользователь с таким емейлом
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Invalid email or password");
  }

  if (!user.verify) {
    throw HttpError(401, "Email is not verified");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Invalid email or password");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  // Записываем токен пользователя в базу
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

// Проверяем авторизовани ли пользователь и выводим его имя и почту
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;

  // Удаляем токен пользователя с базы
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const updateUserAvatar = async (req, res) => {
  const { _id } = req.user;

  // Берем временный путь
  const { path: tempUpload, originalname } = req.file;
  // Добовляем Id к имени файла
  const fileName = `${_id}${originalname}`;
  // Создаем новый путь, где должны быть данные
  const resultUpload = path.join(avatarsDir, fileName);
  // Переименовываем данные
  await fs.rename(tempUpload, resultUpload);

  const resizeUserAvatar = async () => {
    const image = await Jimp.read(resultUpload);
    image.resize(250, 250).write(resultUpload);
  };
  resizeUserAvatar();

  // Записываем новый путь в БЗ
  const avatarURL = path.join("avatars", fileName);
  console.log(avatarURL);

  await User.findByIdAndUpdate(_id, { avatarURL });

  // console.log(`req.file: ${JSON.stringify(req.file)}`);
  // console.log(`tempUpload: ${tempUpload}`);
  // console.log(`originalname: ${originalname}`);
  // console.log(`resultUpload: ${resultUpload}`);
  // await User.findById(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateUserAvatar: ctrlWrapper(updateUserAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
