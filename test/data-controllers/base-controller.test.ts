import * as jwt from 'jsonwebtoken';

import BasicDataController from '../../src/data-controllers/basic-controller';
import { UserType, User } from '../../src/data-types';

interface TestUser {
  username: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  password: string
}

describe('BasicDataController', () => {
  test('BasicDataController has an empty users and empty blogPosts object', () => {
    const controller = new BasicDataController();

    expect(Object.keys(controller.users).length).toBe(0);
    expect(Object.keys(controller.blogPosts).length).toBe(0);
  });

  // describe('blogPosts', () => {});

  describe('users', () => {
    const user1:TestUser = {
      username: 'username',
      email: 'test@test.test',
      password: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      userType: UserType.Admin,
    }

    const user2:TestUser = {
      username: 'username2',
      email: 'test2@test.test',
      password: 'password2',
      firstName: 'firstName2',
      lastName: 'lastName2',
      userType: UserType.SuperAdmin,
    }
    describe('addUser', () => {
      test('addUser will add a user to the users lists', async (done) => {
        const controller = new BasicDataController();

        expect(Object.keys(controller.users).length).toBe(0);

        await controller.addUser(
          user1.username,
          user1.email,
          user1.password,
          user1.firstName,
          user1.lastName,
          user1.userType,
        );

        expect(Object.keys(controller.users).length).toBe(1);

        done();
      });

      test('addUser will start the id of new users at 1 and auto increment the id for new users being added', async (done) => {
        const controller = new BasicDataController();

        await controller.addUser(
          user1.username,
          user1.email,
          user1.password,
          user1.firstName,
          user1.lastName,
          user1.userType,
        );

        await controller.addUser(
          user2.username,
          user2.email,
          user2.password,
          user2.firstName,
          user2.lastName,
          user2.userType,
        );

        expect(controller.users[1].username).toBe(user1.username);
        expect(controller.users[2].username).toBe(user2.username);

        done();
      });
    });

    describe('getUserById', () => {
      let controller: BasicDataController;

      beforeEach(async (done) => {
        controller = new BasicDataController();

        await controller.addUser(
          user1.username,
          user1.email,
          user1.password,
          user1.firstName,
          user1.lastName,
          user1.userType,
        );

        await controller.addUser(
          user2.username,
          user2.email,
          user2.password,
          user2.firstName,
          user2.lastName,
          user2.userType,
        );

        done();
      });

      test('getUserById will get a user, if it exists', async(done) => {
        let user: User;

        user = await controller.getUserById(1);
        expect(user.username).toBe(user1.username);

        user = await controller.getUserById(2);
        expect(user.username).toBe(user2.username);

        done();
      });

      test('getUserById will return null if a user does not exist', async(done) => {
        const user = await controller.getUserById(10);

        expect(user).toBe(null);

        done();
      });
    });

    describe('getUserByUsername', () => {
      let controller: BasicDataController;

      beforeEach(async (done) => {
        controller = new BasicDataController();

        await controller.addUser(
          user1.username,
          user1.email,
          user1.password,
          user1.firstName,
          user1.lastName,
          user1.userType,
        );

        await controller.addUser(
          user2.username,
          user2.email,
          user2.password,
          user2.firstName,
          user2.lastName,
          user2.userType,
        );

        done();
      });

      test('getUserByUsername will get a user, if it exists', async(done) => {
        let user: User;

        user = await controller.getUserByUsername('username');
        expect(user.username).toBe(user1.username);

        user = await controller.getUserByUsername('username2');
        expect(user.username).toBe(user2.username);

        done();
      });

      test('getUserById will return null if a user does not exist', async(done) => {
        const user = await controller.getUserByUsername('no a real username');

        expect(user).toBe(null);

        done();
      });
    });

    describe('logUserIn', () => {
      let controller: BasicDataController;
      const secret = process.env.jwt_secret ?? 'default_secret';

      beforeEach(async (done) => {
        controller = new BasicDataController();

        await controller.addUser(
          user1.username,
          user1.email,
          user1.password,
          user1.firstName,
          user1.lastName,
          user1.userType,
        );

        await controller.addUser(
          user2.username,
          user2.email,
          user2.password,
          user2.firstName,
          user2.lastName,
          user2.userType,
        );

        done();
      });

      test('logUserIn will return a string if the credentials are correct', async(done) => {
        const token = await controller.logUserIn(user1.username, user1.password);

        expect(typeof token).toBe(typeof '');
        expect(token.length > 0).toBe(true);

        const decoded = jwt.verify(token, secret);

        if (typeof decoded === 'object') {
          expect('username' in decoded).toBe(true);

          const anyDecoded: any = decoded;
          expect(anyDecoded.username).toBe(user1.username);
        } else {
          throw new Error('Invalid JWT');
        }

        done();
      });
    });

  });
});




