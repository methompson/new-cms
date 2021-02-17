import UserType from './usertype-type';

interface User {
  username: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  passwordHash?: string
}

export default User;