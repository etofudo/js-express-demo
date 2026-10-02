const express = require('express');
const adminUsersRouter = express.Router();
const userController = require('../controllers/admin_user.controller');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { authorizeRole } = require('../middlewares/roleMiddleware');

adminUsersRouter.get('/', authenticateJWT, authorizeRole(["ADMIN"]), userController.getAllUsers);
adminUsersRouter.post('/', authenticateJWT, authorizeRole(["ADMIN"]), userController.createUser);
adminUsersRouter.get('/:id', authenticateJWT, authorizeRole(["ADMIN"]), userController.getUserById);
adminUsersRouter.put('/:id', authenticateJWT, authorizeRole(["ADMIN"]), userController.updateUser);
adminUsersRouter.delete('/:id', authenticateJWT, authorizeRole(["ADMIN"]), userController.deleteUser);

module.exports = { adminUsersRouter };