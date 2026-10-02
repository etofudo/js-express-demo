const { login, signup, updateProfile, getProfile } = require("../controllers/users.controller");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const authRouter = require("express").Router();

authRouter.post("/auth/login", login);
authRouter.post("/auth/signup", signup);
authRouter.put("/user", authenticateJWT, updateProfile);
authRouter.get("/user", authenticateJWT, getProfile);

module.exports = authRouter;
