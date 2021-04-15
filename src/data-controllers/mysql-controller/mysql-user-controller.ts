import { Pool, createPool, ResultSetHeader } from 'mysql2';
// import * as mysql from 'mysql2';

import MySQLDataControllerBase from './myqsl-controller-base';

import migrations from './db-migrations';
import {
  BlogPost,
  NewBlogPost,
  CMSContext,
  NewUser,
  User,
  NewPage,
  Page,
} from "@dataTypes";
import { DataController, PageController, UserController } from "../interfaces";
import {
  InvalidDataControllerConfigException,
  UnimplementedMethodException,
} from '@root/exceptions/cms-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';
import {
  EmailExistsException,
  InvalidUserIdException,
  UserDoesNotExistException,
  UserExistsException,
  InvalidPasswordTokenException,
} from '@root/exceptions/user-exceptions';

class MySQLUserController extends MySQLDataControllerBase implements UserController {
  async getUserByUsername(username: string): Promise<User> {
    const query = `
      SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        userType,
        password,
        userMeta,
        enabled,
        passwordResetToken,
        passwordResetDate,
        dateAdded,
        dateUpdated
      FROM users
      WHERE username = ?
    `;

    const queryParams = [username];

    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query, queryParams);

    if (!Array.isArray(results) || results.length === 0) {
      throw new UserDoesNotExistException();
    }

    const u = results[0] as any;

    const user = User.fromJson({
      id: `${u.id}`,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
      passwordHash: u.password,
      userMeta: u.userMeta,
      enabled: u.enabled === 1,
      passwordResetToken: u.passwordResetToken,
      passwordResetDate: u.passwordResetDate,
      dateAdded: u.dateAdded,
      dateUpdated: u.dateUpdated,
    }, this.cmsContext.userTypeMap);

    return user;
  }

  async getUserById(userId: string): Promise<User> {
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      throw new InvalidUserIdException();
    }

    const query = `
      SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        userType,
        password,
        userMeta,
        enabled,
        passwordResetToken,
        passwordResetDate,
        dateAdded,
        dateUpdated
      FROM users
      WHERE id = ?
    `;

    const queryParams = [id];

    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query, queryParams);

    if (!Array.isArray(results) || results.length === 0) {
      throw new UserDoesNotExistException();
    }

    const u = results[0] as any;

    const user = User.fromJson({
      id: `${u.id}`,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
      passwordHash: u.password,
      userMeta: u.userMeta,
      enabled: u.enabled === 1,
      passwordResetToken: u.passwordResetToken,
      passwordResetDate: u.passwordResetDate,
      dateAdded: u.dateAdded,
      dateUpdated: u.dateUpdated,
    }, this.cmsContext.userTypeMap);

    return user;
  }

  async addUser(newUser: NewUser): Promise<User> {
    const query = `
      INSERT INTO users (
        firstName,
        lastName,
        username,
        email,
        userType,
        password,
        userMeta,
        enabled
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const queryParams = [
      newUser.firstName,
      newUser.lastName,
      newUser.username,
      newUser.email,
      newUser.userType.toString(),
      newUser.passwordHash,
      newUser.userMeta,
      newUser.enabled,
    ];

    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query, queryParams);

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    const id = results.insertId;

    const user = await this.getUserById(id.toString());

    return user;
  }

  async editUser(editedUser: User): Promise<User> {
    const query = `
      UPDATE users
      SET
        firstName = ?,
        lastName = ?,
        username = ?,
        email = ?,
        userType = ?,
        userMeta = ?,
        enabled = ?,
        dateUpdated = ?
      WHERE id = ?
    `;

    const now = new Date();

    const queryParams = [
      editedUser.firstName,
      editedUser.lastName,
      editedUser.username,
      editedUser.email,
      editedUser.userType.toString(),
      editedUser.userMeta,
      editedUser.enabled,
      now,
      editedUser.id,
    ];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        if (e.message.includes('email')) {
          throw new EmailExistsException();
        } else if (e.message.includes('username')) {
          throw new UserExistsException();
        }
      }

      throw new InvalidResultException(e.message);
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    const user = await this.getUserById(editedUser.id);

    return user;
  }

  async makePasswordResetToken(userId: string, token: string): Promise<void> {
    const query = `
      UPDATE users
      SET
        passwordResetToken = ?,
        passwordResetDate = ?
      WHERE id = ?
    `;

    const queryParams = [
      token,
      new Date(),
      userId,
    ];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
      console.log();
    } catch(e) {
      throw new Error('Unable to update database');
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const query = `
      UPDATE users
      SET
        password = ?
      WHERE id = ?
    `;

    const queryParams = [
      newPassword,
      userId,
    ];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
      console.log();
    } catch(e) {
      throw new Error('Unable to update password');
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }
  }

  async deleteUser(id: string): Promise<void> {
    const query = 'DELETE FROM users WHERE id = ? LIMIT 1';

    const queryParams = [id];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch(e) {
      throw new InvalidResultException(`${e}`);
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }
  }

  async isNoUsers(): Promise<boolean> {
    const query = `SELECT id FROM users`;
    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query);

    if (Array.isArray(results) && results.length > 0) {
      return false;
    }

    return true;
  }

}

export default MySQLUserController;