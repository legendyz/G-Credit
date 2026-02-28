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
  managerId?: string;
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
   * Creates an issuer user (can issue badges)
   */
  async createIssuer(options: CreateUserOptions = {}): Promise<User> {
    return this.createUser({ role: UserRole.ISSUER, ...options });
  }

  /**
   * Creates a manager user (ADR-017: managers have EMPLOYEE role;
   * manager identity is derived from directReports relation).
   * Automatically creates a subordinate to establish manager identity.
   */
  async createManager(options: CreateUserOptions = {}): Promise<User> {
    const manager = await this.createUser({
      role: UserRole.EMPLOYEE,
      ...options,
    });
    // ADR-017: Create a subordinate to establish manager identity (directReports)
    await this.createUser({
      role: UserRole.EMPLOYEE,
      firstName: 'Sub',
      lastName: `Of${manager.id.substring(0, 6)}`,
      managerId: manager.id,
    });
    return manager;
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
        firstName:
          options.firstName ||
          `Test${role.charAt(0)}${role.slice(1).toLowerCase()}`,
        lastName: options.lastName || `User${uniqueId}`,
        role,
        emailVerified: options.emailVerified ?? true,
        department: options.department,
        managerId: options.managerId,
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
   * ADR-017: Employees are assigned to the manager via managerId
   */
  async createTestTeam(): Promise<{
    admin: User;
    manager: User;
    employees: User[];
  }> {
    const admin = await this.createAdmin();
    // createManager already creates one subordinate (ADR-017)
    const manager = await this.createManager();
    // Create additional employees under this manager
    const employees: User[] = [];
    for (let i = 0; i < 3; i++) {
      employees.push(
        await this.createUser({
          role: UserRole.EMPLOYEE,
          managerId: manager.id,
        }),
      );
    }

    return { admin, manager, employees };
  }

  /**
   * Login helper - returns JWT token for user
   */
  static getTestCredentials(
    email: string,
    password = 'TestPassword123!',
  ): {
    email: string;
    password: string;
  } {
    return { email, password };
  }
}

export default UserFactory;
