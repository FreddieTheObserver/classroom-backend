import type { Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';

interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: Role;
}

export async function createUser(input: CreateUserInput): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { email: input.email }});
    if (existing) throw new AppError(409, "EmailAlreadyRegistered");

    return prisma.user.create({
        data: {
            email: input.email,
            passwordHash: await hashPassword(input.password),
            name: input.name,
            role: input.role ?? 'STUDENT',
        },
    });
}

export async function authenticate(email: string, password: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, "InvalidCredentials");

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) throw new AppError(401, "InvalidCredentials");

    return user;
}