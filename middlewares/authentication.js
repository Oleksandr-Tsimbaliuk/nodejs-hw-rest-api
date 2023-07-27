const jwt = require("jsonwebtoken");
const HttpError = require("../utils/HttpError");
require("dotenv").config();
const { User } = require("../models/user");

const { SECRET_KEY } = process.env;

const authentication = async (req, res, next) => {
  const { authorization = "" } = req.headers;

  const [bearer, token] = authorization.split(" ");
  console.log(`bearer: ${bearer}`);
  console.log(`token: ${token}`);

  if (bearer !== "Bearer") {
    next(HttpError(401));
  }

  try {
    // Из  payload достаем id
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);

    console.log(`token: ${token}`);
    console.log(`SECRET_KEY: ${SECRET_KEY}`);

    console.log(`user: ${user}`);
    console.log(`id: ${id}`);

    if (!user) {
      next(HttpError(401));
    }
    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};

module.exports = authentication;