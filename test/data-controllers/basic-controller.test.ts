import * as jwt from 'jsonwebtoken';

import { BasicDataController } from '../../src/data-controllers/basic-controller';
import { UserType, User, UserToken, UserTypeMap, NewUser, NewBlogPost, BlogPost } from '../../src/data-types';
import { InvalidPasswordException, InvalidUsernameException } from '../../src/exceptions/user-exceptions';
import { BlogDoesNotExistException } from '../../src/exceptions/blog-exceptions';

describe('BasicDataController', () => {
  const userTypeMap = new UserTypeMap();

  test('BasicDataController has an empty users and empty blogPosts object', () => {
    const controller = new BasicDataController();

    expect(Object.keys(controller.users).length).toBe(0);
    expect(Object.keys(controller.blogPosts).length).toBe(0);
  });

  describe('blogPosts', () => {
    describe('getBlogPostBySlug', () => {
      test('getBlogPostBySlug will retrieve a blog post if you provide a valid title slug', async (done) => {
        const controller = new BasicDataController();

        const entry = await controller.addBlogPost({
          title: 'test title',
          titleSlug: 'test_title_slug',
          content: 'content',
          preview: 'preview',
          publishDate: 1,
          updateDate: 1,
          author: 1,
        });

        const post = await controller.getBlogPostBySlug('test_title_slug');

        expect(post.id).toBe(entry.id);

        done();
      });

      test('getBlogPostBySlug will return null if you do not request a valid slug', async (done) => {
        const controller = new BasicDataController();

        const post = await controller.getBlogPostBySlug('test_title_slug');

        expect(post).toBeNull();

        done();
      });
    });

    describe('getBlogPostById', () => {
      test('getBlogPostById will retrieve a blog post by id', async (done) => {
        const controller = new BasicDataController();

        const entry = await controller.addBlogPost({
          title: 'test title',
          titleSlug: 'test_title_slug',
          content: 'content',
          preview: 'preview',
          publishDate: 1,
          updateDate: 1,
          author: 1,
        });

        const post = await controller.getBlogPostById(entry.id);

        expect(post.id).toBe(entry.id);

        done();
      });

      test('getBlogPostById will retrieve a blog post by id', async (done) => {
        const controller = new BasicDataController();

        let caught: number = 0;
        try {
          const post = await controller.getBlogPostById('1');
        } catch(e) {
          expect(e instanceof BlogDoesNotExistException);
          caught += 1;
        }

        expect(caught).toBe(1);

        done();
      });
    });

    describe('addBlogPost', () => {
      test('addBlogPost will add a blog post and return a blog post object', async (done) => {
        const controller = new BasicDataController();

        const newBlogPost: NewBlogPost = {
          title: 'test title',
          titleSlug: 'test_title_slug',
          content: 'content',
          preview: 'preview',
          publishDate: 1,
          updateDate: 1,
          author: 1,
        };

        const entry = await controller.addBlogPost(newBlogPost);

        expect(entry.title).toBe(newBlogPost.title);
        expect(entry.titleSlug).toBe(newBlogPost.titleSlug);
        expect(entry.content).toBe(newBlogPost.content);
        expect(entry.preview).toBe(newBlogPost.preview);
        expect(entry.publishDate).toBe(newBlogPost.publishDate);
        expect(entry.updateDate).toBe(newBlogPost.updateDate);
        expect(entry.author).toBe(newBlogPost.author);

        done();
      });
    });

    describe('editBlogPost', () => {
      test('editBlogPost will update the blog post from the controller', async (done) => {
        const controller = new BasicDataController();

        const newBlogPost: NewBlogPost = {
          title: 'test title',
          titleSlug: 'test_title_slug',
          content: 'content',
          preview: 'preview',
          publishDate: 1,
          updateDate: 1,
          author: 1,
        };

        const entry = await controller.addBlogPost(newBlogPost);

        expect(entry.title).toBe(newBlogPost.title);
        expect(entry.titleSlug).toBe(newBlogPost.titleSlug);
        expect(entry.content).toBe(newBlogPost.content);
        expect(entry.preview).toBe(newBlogPost.preview);
        expect(entry.publishDate).toBe(newBlogPost.publishDate);
        expect(entry.updateDate).toBe(newBlogPost.updateDate);
        expect(entry.author).toBe(newBlogPost.author);

        const updatedBlogPost: BlogPost = {
          id: entry.id,
          title: 'updated title',
          titleSlug: 'new_test_title_slug',
          content: 'edited_content',
          preview: 'edited_preview',
          publishDate: 1,
          updateDate: 2,
          author: 3,
        };

        const updatedEntry = await controller.editBlogPost(updatedBlogPost);

        expect(updatedEntry.id).toBe(updatedBlogPost.id);
        expect(updatedEntry.title).toBe(updatedBlogPost.title);
        expect(updatedEntry.titleSlug).toBe(updatedBlogPost.titleSlug);
        expect(updatedEntry.content).toBe(updatedBlogPost.content);
        expect(updatedEntry.preview).toBe(updatedBlogPost.preview);
        expect(updatedEntry.publishDate).toBe(updatedBlogPost.publishDate);
        expect(updatedEntry.updateDate).toBe(updatedBlogPost.updateDate);
        expect(updatedEntry.author).toBe(updatedBlogPost.author);

        done();
      });

      test('editBlogPost will throw an error if the blog post does not exist', async (done) => {
        const controller = new BasicDataController();

        let caught = 0;

        try {
          await controller.editBlogPost({
            id: '1',
            title: 'test title',
            titleSlug: 'test_title_slug',
            content: 'content',
            preview: 'preview',
            publishDate: 1,
            updateDate: 1,
            author: 1,
          });
        } catch (e) {
          expect(e instanceof BlogDoesNotExistException);
          caught += 1;
        }

        expect(caught).toBe(1);

        done();
      });
    });

    describe('deleteBlogPost', () => {
      test('deleteBlogPost will delete the blog post from the controller', async (done) => {
        const controller = new BasicDataController();

        const newBlogPost: NewBlogPost = {
          title: 'test title',
          titleSlug: 'test_title_slug',
          content: 'content',
          preview: 'preview',
          publishDate: 1,
          updateDate: 1,
          author: 1,
        };

        const entry = await controller.addBlogPost(newBlogPost);

        let blog: BlogPost;

        blog = await controller.getBlogPostById(entry.id);

        expect(blog.id).toBe(entry.id);

        await controller.deleteBlogPost(entry.id);

        blog = await controller.getBlogPostById(entry.id);

        expect(blog).toBe(null);

        done();
      });

      test('deleteBlogPost will throw an error if the blog post does not exist', async (done) => {
        const controller = new BasicDataController();

        let caught = 0;

        try {
          await controller.deleteBlogPost('1');
        } catch (e) {
          expect(e instanceof BlogDoesNotExistException);
          caught += 1;
        }

        expect(caught).toBe(1);

        done();
      });
    });

  });

  describe('users', () => {
    const user1: NewUser = {
      username: 'username',
      email: 'test@test.test',
      passwordHash: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      userType: userTypeMap.getUserType('Admin'),
    }

    const user2: NewUser = {
      username: 'username2',
      email: 'test2@test.test',
      passwordHash: 'password2',
      firstName: 'firstName2',
      lastName: 'lastName2',
      userType: userTypeMap.getUserType('SuperAdmin'),
    }
    describe('addUser', () => {
      test('addUser will add a user to the users lists', async (done) => {
        const controller = new BasicDataController();

        expect(Object.keys(controller.users).length).toBe(0);

        const newUser: NewUser = {
          ...user1,
        };

        await controller.addUser(newUser);

        expect(Object.keys(controller.users).length).toBe(1);

        done();
      });

      test('addUser will start the id of new users at 1 and auto increment the id for new users being added', async (done) => {
        const controller = new BasicDataController();

        const newUser1 = { ...user1 };
        const newUser2 = { ...user2 };

        await controller.addUser(newUser1);
        await controller.addUser(newUser2);

        expect(controller.users[1].username).toBe(user1.username);
        expect(controller.users[2].username).toBe(user2.username);

        done();
      });
    });

    describe('getUserById', () => {
      let controller: BasicDataController;

      beforeEach(async (done) => {
        controller = new BasicDataController();

        const newUser1 = { ...user1 };
        const newUser2 = { ...user2 };

        await controller.addUser(newUser1);
        await controller.addUser(newUser2);

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

        const newUser1 = { ...user1 };
        const newUser2 = { ...user2 };

        await controller.addUser(newUser1);
        await controller.addUser(newUser2);

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

        const newUser1 = { ...user1 };
        const newUser2 = { ...user2 };

        await controller.addUser(newUser1);
        await controller.addUser(newUser2);

        done();
      });

      test('logUserIn will return a string if the credentials are correct', async(done) => {
        const token = await controller.logUserIn(user1.username, user1.passwordHash);

        expect(typeof token).toBe(typeof '');
        expect(token.length > 0).toBe(true);

        const decoded = jwt.verify(token, secret);

        if (typeof decoded === 'object') {
          expect('username' in decoded).toBe(true);

          const typedDecoded = decoded as UserToken;
          expect(typedDecoded.username).toBe(user1.username);
        } else {
          throw new Error('Invalid JWT');
        }

        done();
      });

      test('logUserIn will throw an error if the user doesn not exist', async(done) => {
        let caught = false;
        try {
          await controller.logUserIn('not a user name', user1.passwordHash);
        } catch (e) {
          expect(e instanceof InvalidUsernameException).toBe(true);
          caught = true;
        }

        expect(caught).toBe(true);

        done();
      });

      test("logUserIn will throw an error if the user's password is invalid", async(done) => {
        let caught = false;
        try {
          await controller.logUserIn(user1.username, 'incorrect password');
        } catch (e) {
          expect(e instanceof InvalidPasswordException).toBe(true);
          caught = true;
        }

        expect(caught).toBe(true);

        done();
      });

    });

  });
});
