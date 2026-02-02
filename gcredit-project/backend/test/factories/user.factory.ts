/**
 * User Factory (Story 8.8 - AC2)
 * TD-001: Test Data Factory Pattern for isolated test data
 *
 * Creates test users with unique identifiers to prevent
 * data collisions in parallel tests.
 */

import { PrismaClient, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  emailVerified?: boolean;
  department?: string;
}

/**
 * User Factory for creating test users
 */
export class UserFactory {
  private prisma: PrismaClient;
  private testPrefix: string;

  constructor(prisma: PrismaClient, testPrefix?: string) {
    this.prisma = prisma;
    this.testPrefix = testPrefix || uuidv4().substring(0, 8);
  }

  /**
   * Creates an employee user
   */
  async createEmployee(options: CreateUserOptions = {}): Promise<User> {
    return this.createUser({ role: UserRole.EMPLOYEE, ...options });
  }

  /**
   * Creates an issuer/manager user
   */
  async createIssuer(options: CreateUserOptions = {}): Promise<User> {
    return this.createUser({ role: UserRole.MANAGER, ...options });
  }

  /**
   * Creates a manager user
   */
  async createManager(options: CreateUserOptions = {}): Promise<User> {
    return this.createUser({ role: UserRole.MANAGER, ...options });
  }

  /**
   * Creates an admin user
   */
  async createAdmin(options: CreateUserOptions = {}): Promise<User> {
    return this.createUser({ role: UserRole.ADMIN, ...options });
  }

  /**
   * Creates a user with specified options
   */
  async createUser(options: CreateUserOptions = {}): Promise<User> {
    const uniqueId = uuidv4().substring(0, 8);
    const role = options.role || UserRole.EMPLOYEE;
    const rolePrefix = role.toLowerCase();

    const email =
      options.email || `${rolePrefix}-${this.testPrefix}-${uniqueId}@test.com`;
    const password = options.password || 'TestPassword123!';
    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: options.firstName || `Test${role.charAt(0)}${role.slice(1).toLowerCase()}`,
        lastName: options.lastName || `User${uniqueId}`,
        role,
        emailVerified: options.emailVerified ?? true,
        department: options.department,
      },
    });
  }

  /**
   * Creates multiple users at once
   */
  async createMany(
    count: number,
    options: CreateUserOptions = {},
  ): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser(options));
    }
    return users;
  }

  /**
   * Creates a complete test team: admin, manager, and employees
   */
  async createTestTeam(): Promise<{
    admin: User;
    manager: User;
    employees: User[];
  }> {
    const admin = await this.createAdmin();
    const manager = await this.createManager();
    const employees = await this.createMany(3, { role: UserRole.EMPLOYEE });

    return { admin, manager, employees };
  }

  /**
   * Login helper - returns JWT token for user
   */
  static getTestCredentials(email: string, password = 'TestPassword123!'): {
    email: string;
    password: string;
  } {
    return { email, password };
  }
}

export default UserFactory;
