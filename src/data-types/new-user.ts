import UserType from './usertype';

interface NewUser {
  username: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  passwordHash?: string
}

export default NewUser;