class UserType {
  constructor(private typeName: string, private level: number) {}

  toString(): string {
    return this.name;
  }

  get name(): string {
    return this.typeName;
  }

  get accessLevel(): number {
    return this.level;
  }

  /**
   * This method accepts one UserType and determines if this UserType has a
   * sufficient access level to access whatever is required by the passed
   * UserType.
   *
   * @param level The UserType required for access.
   * @returns boolean true means that the current UserType can access this UserType
   */
  canAccessLevel(userType: UserType): boolean {
    return this.level >= userType.accessLevel;
  }
}

export default UserType;